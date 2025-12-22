#!/usr/bin/env node

const express = require('express');
const { 
  BedrockAgentRuntimeClient,
  InvokeAgentCommand 
} = require('@aws-sdk/client-bedrock-agent-runtime');
const { fromIni } = require('@aws-sdk/credential-providers');

const app = express();
app.use(express.json());

// Agent configuration
const AGENT_ID = 'MJWLKRZQLY';
const AGENT_ALIAS_ID = 'AXKLUAP9PR'; // Updated alias pointing to version 2 with optional email params
const REGION = 'us-west-2';

function parseCitations(response, retrievalResults = []) {
  const uniqueS3Files = [];
  const s3FileToCitationNum = {};
  
  retrievalResults.forEach(ref => {
    const s3Uri = ref.s3Uri;
    if (s3Uri && s3Uri !== 'unknown' && !s3FileToCitationNum[s3Uri]) {
      uniqueS3Files.push(s3Uri);
      s3FileToCitationNum[s3Uri] = uniqueS3Files.length;
    }
  });
  
  console.log('📚 Unique S3 files found:', uniqueS3Files.length);
  console.log('📚 S3 to citation mapping:', JSON.stringify(s3FileToCitationNum, null, 2));
  const answerPartRegex = /<answer_part>\s*<text>([\s\S]*?)<\/text>\s*<sources>([\s\S]*?)<\/sources>\s*<\/answer_part>/g;
  const sourceRegex = /<source>(.*?)<\/source>/g;
  
  let match;
  const citationToPath = {};
  let formattedResponse = '';
  let partNumber = 0;
  let hasRealTimeData = false;
  
  while ((match = answerPartRegex.exec(response)) !== null) {
    let text = match[1].trim();
    const sourcesXml = match[2];
    partNumber++;
    
    const sourceCount = (sourcesXml.match(/<source>/g) || []).length;
    console.log(`📋 Part ${partNumber}: ${sourceCount} sources in XML`);
    
    if (sourcesXml.includes('FRED') || sourcesXml.includes('Federal Reserve Economic Data')) {
      hasRealTimeData = true;
      console.log('📊 Real-time data detected from FRED API');
    }
    
    if (partNumber <= uniqueS3Files.length) {
      text += `[${partNumber}]`;
    }
    
    formattedResponse += text + ' ';
  }
  
  uniqueS3Files.forEach((s3Uri, index) => {
    citationToPath[index + 1] = s3Uri;
  });
  
  if (formattedResponse) {
    return {
      text: formattedResponse.trim(),
      citationMap: citationToPath,
      hasRealTimeData: hasRealTimeData
    };
  }
  
  const answerMatch = response.match(/<answer>([\s\S]*?)<\/answer>/);
  if (answerMatch) {
    const answerContent = answerMatch[1];
    const simpleMatch = answerContent.match(answerPartRegex);
    if (simpleMatch) {
      return parseCitations(answerContent, retrievalResults);
    }
    return {
      text: answerContent.replace(/<[^>]*>/g, '').trim(),
      citationMap: {},
      hasRealTimeData: false
    };
  }
  
  return {
    text: response.replace(/<[^>]*>/g, '').trim(),
    citationMap: {},
    hasRealTimeData: false
  };
}

const client = new BedrockAgentRuntimeClient({
  region: REGION,
  credentials: fromIni({ profile: 'default' })
});

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.post('/invoke-agent', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log('📤 Proxying to agent:', message);

    const sessionId = `session-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const command = new InvokeAgentCommand({
      agentId: AGENT_ID,
      agentAliasId: AGENT_ALIAS_ID,
      sessionId: sessionId,
      inputText: message,
      enableTrace: true,
    });

    const response = await client.send(command);

    let fullResponse = '';
    let rawModelResponse = '';
    let retrievalResults = []; // Store source metadata
    
    for await (const event of response.completion) {
      if (event.chunk?.bytes) {
        const text = new TextDecoder().decode(event.chunk.bytes);
        fullResponse += text;
      }
      
      if (event.trace?.trace?.orchestrationTrace?.modelInvocationOutput?.rawResponse?.content) {
        rawModelResponse = event.trace.trace.orchestrationTrace.modelInvocationOutput.rawResponse.content;
      }
      
      if (event.trace?.trace?.orchestrationTrace?.observation?.knowledgeBaseLookupOutput?.retrievedReferences) {
        const refs = event.trace.trace.orchestrationTrace.observation.knowledgeBaseLookupOutput.retrievedReferences;
        
        if (refs.length > 0) {
          console.log('📚 Full structure of first reference:', JSON.stringify(refs[0], null, 2));
        }
        
        retrievalResults = refs.map((ref, index) => {
          const metadata = ref.metadata || {};
          
          return {
            index: index,
            sourceId: ref.location?.s3Location?.uri || 'unknown',
            s3Uri: ref.location?.s3Location?.uri || metadata['x-amz-bedrock-kb-source-uri'] || 'unknown',
            content: ref.content?.text?.substring(0, 200) || '',
            metadata: metadata
          };
        });
        console.log('📚 Found', retrievalResults.length, 'retrieval sources');
      }
    }

    if (rawModelResponse) {
      console.log('📋 RAW XML (first 500 chars):\n', rawModelResponse.substring(0, 500));
      
      const partRegex = /<answer_part>\s*<text>([\s\S]*?)<\/text>\s*<sources>([\s\S]*?)<\/sources>\s*<\/answer_part>/g;
      let partMatch;
      let partNum = 1;
      while ((partMatch = partRegex.exec(rawModelResponse)) !== null) {
        console.log(`📋 Part ${partNum}:`, partMatch[1].substring(0, 100) + '...');
        console.log(`📋 Part ${partNum} sources:`, partMatch[2]);
        partNum++;
      }
    }

    let parsedResult;
    if (rawModelResponse) {
      parsedResult = parseCitations(rawModelResponse, retrievalResults);
    } else {
      parsedResult = {
        text: fullResponse.trim(),
        citationMap: {}
      };
    }
    
    console.log('Agent response (with citations):', parsedResult.text.substring(0, 150) + '...');
    console.log('Citation map:', JSON.stringify(parsedResult.citationMap, null, 2));
    console.log('Has real-time data:', parsedResult.hasRealTimeData);
    console.log('Sending JSON response with hasRealTimeData =', parsedResult.hasRealTimeData || false);

    const responsePayload = { 
      response: parsedResult.text,
      citations: parsedResult.citationMap,
      hasRealTimeData: parsedResult.hasRealTimeData || false,
      sessionId: sessionId
    };
    
    console.log('Full response payload:', JSON.stringify(responsePayload, null, 2));
    
    res.json(responsePayload);

  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ 
      error: error.message,
      details: error.toString()
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    agent: AGENT_ID,
    region: REGION,
    message: 'Proxy server is running and can access AWS credentials'
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log('🚀 Bedrock Agent Proxy Server running on http://localhost:' + PORT);
  console.log('📍 Endpoint: http://localhost:' + PORT + '/invoke-agent');
  console.log('🔐 Using credentials from ~/.aws/credentials');
});


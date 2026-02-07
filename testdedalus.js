// ============================================================================
// TEST SCRIPT: Check if Dedalus is Running
// ============================================================================
// Run this with: node test-dedalus.js
// Make sure your server is running first (npm start)
// ============================================================================

const API_URL = 'http://localhost:3000';

async function testOrchestrator() {
  console.log('\n🧪 Testing Smart Spending Orchestrator...\n');
  
  try {
    const response = await fetch(`${API_URL}/api/orchestrator/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'u1' })  // Test with Alex Chen
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Orchestrator is working!\n');
      
      // Check which mode is running
      const mode = data.pipeline?.mode || 'unknown';
      const modelsUsed = data.pipeline?.modelsUsed || [];
      
      console.log('━'.repeat(50));
      console.log('📊 PIPELINE STATUS:');
      console.log('━'.repeat(50));
      
      if (mode === 'dedalus-multi-model') {
        console.log('🚀 Mode: DEDALUS MULTI-MODEL (Real integration!)');
        console.log('   ↳ Using different models for each step\n');
      } else if (mode === 'anthropic-fallback') {
        console.log('⚠️  Mode: ANTHROPIC FALLBACK');
        console.log('   ↳ Dedalus not configured, using Claude for all steps\n');
      } else {
        console.log(`❓ Mode: ${mode}`);
        console.log('   ↳ Check your server.js implementation\n');
      }
      
      console.log('━'.repeat(50));
      console.log('🤖 MODELS USED:');
      console.log('━'.repeat(50));
      
      modelsUsed.forEach((step, i) => {
        const providerEmoji = step.provider === 'dedalus' ? '🟢' : '🟡';
        console.log(`Step ${i + 1}: ${step.task}`);
        console.log(`   ${providerEmoji} Model: ${step.model}`);
        console.log(`   ⏱️  Latency: ${step.latency}`);
        console.log(`   📡 Provider: ${step.provider || 'anthropic'}`);
        console.log('');
      });
      
      console.log('━'.repeat(50));
      console.log('💰 ANALYSIS SUMMARY:');
      console.log('━'.repeat(50));
      console.log(`Potential Monthly Savings: $${data.summary?.potentialMonthlySavings}`);
      console.log(`Potential Annual Savings: $${data.summary?.potentialAnnualSavings}`);
      console.log(`Top Opportunity: ${data.summary?.topOpportunity}`);
      console.log('');
      
    } else {
      console.log('❌ Orchestrator returned error:', data.error);
    }
    
  } catch (error) {
    console.log('❌ Failed to connect to server:', error.message);
    console.log('\n💡 Make sure your server is running: npm start');
  }
}

// Also check environment variables
function checkEnvVars() {
  console.log('━'.repeat(50));
  console.log('🔑 ENVIRONMENT CHECK:');
  console.log('━'.repeat(50));
  
  const dedalusKey = process.env.DEDALUS_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  
  if (dedalusKey) {
    console.log(`✅ DEDALUS_API_KEY: Set (${dedalusKey.slice(0, 8)}...)`);
  } else {
    console.log('❌ DEDALUS_API_KEY: Not set');
  }
  
  if (anthropicKey) {
    console.log(`✅ ANTHROPIC_API_KEY: Set (${anthropicKey.slice(0, 8)}...)`);
  } else {
    console.log('❌ ANTHROPIC_API_KEY: Not set');
  }
  
  console.log('');
}

// Run tests
require('dotenv').config();
checkEnvVars();
testOrchestrator();
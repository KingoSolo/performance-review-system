import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { ScoringService } from './src/scoring/scoring.service';

async function testScoreNotification() {
  console.log('\n🧪 Testing Score Available Notification\n');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  const scoringService = app.get(ScoringService);
  
  // Use existing test data
  const cycleId = 'cmlu75q97000ac9dleozcm2hd'; // h2 2025 performance skills
  const employeeId = 'toiddeucricraucre-7906@yopmail.com'; // Shaun Murphy
  const companyId = 'cmltwl0gm0000c9n1kfccq2l2'; // JD company
  
  console.log('📊 Calculating score for employee...');
  console.log(`   Employee ID: ${employeeId}`);
  console.log(`   Cycle ID: ${cycleId}`);
  
  try {
    const result = await scoringService.calculateFinalScore(
      employeeId,
      cycleId,
      companyId,
    );
    
    console.log('\n✅ Score calculated successfully!');
    console.log(`   Employee: ${result.employeeName}`);
    console.log(`   Overall Score: ${result.overall_score}`);
    console.log(`   Breakdown:`, result.breakdown);
    
    console.log('\n📧 Email notification should have been triggered!');
    console.log('   Check backend logs for email send confirmation');
    console.log('   Check Resend dashboard: https://resend.com/emails');
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
  
  await app.close();
}

testScoreNotification();

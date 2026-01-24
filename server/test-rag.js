import { retrieveContext } from './services/ragService.js';

console.log('\n🧪 Testing RAG Service Fix\n');
console.log('='.repeat(60));

// Test 1: "back pain" should NOT match chest pain protocol
console.log('\n📋 Test 1: "back pain" query');
const result1 = retrieveContext('i am having back pain');
console.log('Result:', result1 ? '❌ FAILED - Matched incorrectly' : '✅ PASSED - No match');

// Test 2: "chest pain" SHOULD match chest pain protocol
console.log('\n📋 Test 2: "chest pain" query');
const result2 = retrieveContext('i am having chest pain');
console.log('Result:', result2 ? '✅ PASSED - Matched correctly' : '❌ FAILED - Should have matched');
if (result2) {
    console.log('Content preview:', result2.substring(0, 50) + '...');
}

// Test 3: "heart pain" SHOULD match chest pain protocol
console.log('\n📋 Test 3: "heart pain" query');
const result3 = retrieveContext('i have severe heart pain');
console.log('Result:', result3 ? '✅ PASSED - Matched correctly' : '❌ FAILED - Should have matched');

// Test 4: "dengue fever" SHOULD match dengue protocol (2 keywords)
console.log('\n📋 Test 4: "dengue fever" query');
const result4 = retrieveContext('i think i have dengue fever');
console.log('Result:', result4 ? '✅ PASSED - Matched correctly' : '❌ FAILED - Should have matched');

console.log('\n' + '='.repeat(60));
console.log('✅ RAG Service Test Complete\n');

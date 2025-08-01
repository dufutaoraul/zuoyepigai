const XLSX = require('xlsx');
const fs = require('fs');

// Read the Excel file
const workbook = XLSX.readFile('2025爱学AI实训营课程作业清单.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Convert to JSON
const data = XLSX.utils.sheet_to_json(worksheet);

console.log('Assignment data structure:');
console.log('Total assignments:', data.length);
console.log('Sample record:', data[0]);
console.log('\nAll column names:');
console.log(Object.keys(data[0]));

// Process and categorize assignments
const assignments = data.map((row, index) => {
  // Extract day information from actual column name
  const dayText = row['第几天'] || '';
  let dayNumber = null;
  
  // Parse different day formats - 支持上午/下午格式
  if (dayText.includes('第一天上午') || dayText.includes('第一天')) dayNumber = 1;
  else if (dayText.includes('第一天下午')) dayNumber = 1; // 第一天下午也是第一天
  else if (dayText.includes('第二天上午') || (dayText.includes('第二天') && !dayText.includes('下午'))) dayNumber = 2;
  else if (dayText.includes('第二天下午')) dayNumber = 2; // 第二天下午也是第二天
  else if (dayText.includes('第三天')) dayNumber = 3;
  else if (dayText.includes('第四天')) dayNumber = 4;
  else if (dayText.includes('第五天')) dayNumber = 5;
  else if (dayText.includes('第六天')) dayNumber = 6;
  else if (dayText.includes('第七天')) dayNumber = 7;
  // 兼容旧格式
  else if (dayText.includes('第一周第一天')) dayNumber = 1;
  else if (dayText.includes('第一周第二天')) dayNumber = 2;
  else if (dayText.includes('第一周第三天')) dayNumber = 3;
  else if (dayText.includes('第一周第四天')) dayNumber = 4;
  else if (dayText.includes('第一周第五天')) dayNumber = 5;
  else if (dayText.includes('第二周')) dayNumber = 6;
  else if (dayText.includes('第三周')) dayNumber = 7;
  else {
    // Try to extract number
    const dayMatch = dayText.toString().match(/第?(\d+)天/);
    dayNumber = dayMatch ? parseInt(dayMatch[1]) : null;
  }
  
  // Extract assignment title from actual column name
  const title = row['具体作业'] || row['作业名称'] || row['作业标题'] || '';
  
  // Determine if mandatory from actual column name
  const typeText = row['必做/选做'] || row['作业类型'] || row['类型'] || '';
  const isMandatory = typeText.includes('必做');
  
  // Extract description from actual column name
  const description = row['作业详细要求'] || row['具体作业要求'] || row['作业要求'] || row['要求'] || '';
  
  // Determine assignment category for graduation logic
  let category = 'Regular_Optional';
  if (isMandatory) {
    category = 'Mandatory';
  } else if ((dayNumber === 1 || dayNumber === 2) && dayText.includes('下午')) {
    // 第一天下午和第二天下午的选做作业都归为特殊类别
    category = 'W1D2_Afternoon_Optional';
  }
  
  return {
    assignment_id: index + 1,
    day_number: dayNumber,
    assignment_title: title,
    is_mandatory: isMandatory,
    description: description,
    assignment_category: category,
    raw_data: row // Keep original for debugging
  };
});

// Generate SQL for assignments table
const createTableSQL = `
-- Create assignments table
CREATE TABLE IF NOT EXISTS assignments (
  assignment_id SERIAL PRIMARY KEY,
  day_number INTEGER,
  assignment_title TEXT NOT NULL,
  is_mandatory BOOLEAN DEFAULT FALSE,
  description TEXT,
  assignment_category TEXT DEFAULT 'Regular_Optional',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
`;

const insertSQL = assignments.map(assignment => {
  const { assignment_id, day_number, assignment_title, is_mandatory, description, assignment_category } = assignment;
  return `INSERT INTO assignments (assignment_id, day_number, assignment_title, is_mandatory, description, assignment_category) VALUES (${assignment_id}, ${day_number || 'NULL'}, '${assignment_title.replace(/'/g, "''")}', ${is_mandatory}, '${description.replace(/'/g, "''")}', '${assignment_category}');`;
}).join('\n');

const completeSQL = createTableSQL + '\n' + insertSQL;

// Write SQL to file
fs.writeFileSync('ASSIGNMENTS-SETUP.sql', completeSQL);

// Generate summary report
const summary = {
  total: assignments.length,
  mandatory: assignments.filter(a => a.is_mandatory).length,
  optional: assignments.filter(a => !a.is_mandatory).length,
  w1d2_afternoon: assignments.filter(a => a.assignment_category === 'W1D2_Afternoon_Optional').length,
  regular_optional: assignments.filter(a => a.assignment_category === 'Regular_Optional').length,
  by_day: {}
};

assignments.forEach(a => {
  if (a.day_number) {
    summary.by_day[a.day_number] = (summary.by_day[a.day_number] || 0) + 1;
  }
});

console.log('\n=== ASSIGNMENT SUMMARY ===');
console.log('Total assignments:', summary.total);
console.log('Mandatory assignments:', summary.mandatory);
console.log('Optional assignments:', summary.optional);
console.log('W1D2 Afternoon Optional:', summary.w1d2_afternoon);
console.log('Regular Optional:', summary.regular_optional);
console.log('By day:', summary.by_day);

console.log('\n=== FILES GENERATED ===');
console.log('✓ ASSIGNMENTS-SETUP.sql - Complete SQL for assignments table');

// Show special W1D2 assignments for graduation logic
const w1d2Assignments = assignments.filter(a => a.assignment_category === 'W1D2_Afternoon_Optional');
console.log('\n=== W1D2 AFTERNOON ASSIGNMENTS (for graduation criteria) ===');
w1d2Assignments.forEach(a => {
  console.log(`- ${a.assignment_title}`);
});
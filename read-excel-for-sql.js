const XLSX = require('xlsx');

function readExcelForSQL() {
  console.log('📋 读取Excel文件获取准确的"第几天"和"作业详细要求"数据...');
  
  try {
    // 读取Excel文件
    const workbook = XLSX.readFile('2025爱学AI实训营课程作业清单.xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // 转换为JSON
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`✅ 读取到 ${data.length} 条记录`);
    
    // 提取所有作业的数据
    const assignments = [];
    
    data.forEach((row, index) => {
      const dayText = row['第几天'] || '';
      const title = row['具体作业'] || '';
      const requirement = row['作业详细要求'] || '';
      const mandatory = row['必做/选做'] === '必做';
      
      if (title && dayText) {
        assignments.push({
          index: index + 1,
          dayText: dayText.trim(),
          title: title.trim(),
          requirement: requirement.trim(),
          isMandatory: mandatory
        });
        
        console.log(`${index + 1}. "${dayText}" - ${title}`);
      }
    });
    
    console.log(`\n📊 总共处理了 ${assignments.length} 个有效作业`);
    
    // 按天数分组显示
    console.log('\n📋 按天数分组:');
    const dayGroups = {};
    assignments.forEach(assignment => {
      if (!dayGroups[assignment.dayText]) {
        dayGroups[assignment.dayText] = [];
      }
      dayGroups[assignment.dayText].push(assignment);
    });
    
    Object.keys(dayGroups).forEach(dayText => {
      console.log(`\n"${dayText}": ${dayGroups[dayText].length} 个作业`);
      dayGroups[dayText].forEach(assignment => {
        console.log(`  - ${assignment.title}`);
      });
    });
    
    // 返回数据供SQL生成使用
    return assignments;
    
  } catch (error) {
    console.error('❌ 读取Excel失败:', error);
    return [];
  }
}

// 执行读取
const assignments = readExcelForSQL();

// 保存到JSON文件供后续使用
const fs = require('fs');
fs.writeFileSync('excel-assignments-data.json', JSON.stringify(assignments, null, 2));
console.log('\n📁 数据已保存到 excel-assignments-data.json');
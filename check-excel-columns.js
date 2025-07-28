const XLSX = require('xlsx');

function checkExcelColumns() {
  console.log('🔍 检查Excel文件的列名...');
  
  try {
    // 读取Excel文件
    const workbook = XLSX.readFile('2025爱学AI实训营课程作业清单.xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    console.log(`📋 工作表名称: ${sheetName}`);
    
    // 转换为JSON
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    if (data.length > 0) {
      console.log('\n📊 第一行数据的所有列名:');
      const firstRow = data[0];
      Object.keys(firstRow).forEach((key, index) => {
        console.log(`${index + 1}. "${key}": "${firstRow[key]}"`);
      });
      
      console.log('\n📋 前3行完整数据:');
      data.slice(0, 3).forEach((row, index) => {
        console.log(`\n第${index + 1}行:`);
        Object.entries(row).forEach(([key, value]) => {
          console.log(`  ${key}: "${value}"`);
        });
      });
    }
    
  } catch (error) {
    console.error('❌ 检查Excel失败:', error);
  }
}

checkExcelColumns();
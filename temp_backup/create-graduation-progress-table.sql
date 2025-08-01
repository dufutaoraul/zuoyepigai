-- 创建毕业统计表
CREATE TABLE IF NOT EXISTS graduation_progress (
    student_id VARCHAR PRIMARY KEY REFERENCES students(student_id) ON DELETE CASCADE,
    
    -- 必做作业统计
    mandatory_completed_count INTEGER DEFAULT 0,
    mandatory_total_count INTEGER DEFAULT 28, -- 根据参考文件中的必做作业数量
    mandatory_completed_list TEXT[] DEFAULT '{}', -- 已完成的必做作业ID数组
    
    -- 第一周第二天下午选做作业统计  
    w1d2_afternoon_completed_count INTEGER DEFAULT 0,
    w1d2_afternoon_required_count INTEGER DEFAULT 1,
    w1d2_afternoon_completed_list TEXT[] DEFAULT '{}', -- 已完成的作业ID数组
    
    -- 其他选做作业统计
    other_optional_completed_count INTEGER DEFAULT 0, 
    other_optional_required_count INTEGER DEFAULT 1,
    other_optional_completed_list TEXT[] DEFAULT '{}', -- 已完成的作业ID数组
    
    -- 毕业状态
    is_qualified BOOLEAN DEFAULT FALSE,
    missing_requirements TEXT[] DEFAULT '{}', -- 缺失的要求描述
    last_updated TIMESTAMP DEFAULT NOW()
);

-- 创建索引优化查询
CREATE INDEX IF NOT EXISTS idx_graduation_progress_qualified ON graduation_progress(is_qualified);
CREATE INDEX IF NOT EXISTS idx_graduation_progress_updated ON graduation_progress(last_updated);

-- 添加注释
COMMENT ON TABLE graduation_progress IS '学员毕业进度统计表';
COMMENT ON COLUMN graduation_progress.mandatory_completed_count IS '已完成的必做作业数量';
COMMENT ON COLUMN graduation_progress.w1d2_afternoon_completed_count IS '第一周第二天下午已完成的选做作业数量';
COMMENT ON COLUMN graduation_progress.other_optional_completed_count IS '其他已完成的选做作业数量';
COMMENT ON COLUMN graduation_progress.is_qualified IS '是否符合毕业条件';
COMMENT ON COLUMN graduation_progress.missing_requirements IS '缺失的毕业要求描述';
# Gemini 4：7 任务 K0–K10 快照

模型：gemini-4-argon-high。共有 79 条尝试记录，其中 62 条有评分，17 条无终局评分。
按 MANIFEST.tsv 的非空评分记录选取唯一 (task, k)，并对 K1–K10 的 55 条记录与 failure-feedback.json 的 native_result 核对。
K0 共 7 次，均因 effective_reasoning_time_limit 结束；evaluation_outcome 的 complete/valid_for_success_rate 均为 false。K0 分数采用 manifest，与 provisional live-native-score 核对，不称为完整原生终局成绩。
11 条有评分记录的控制阶段为 REVISING：保留已产生的物理结果，不把修订状态等同于评分缺失，也不声称所有修订完成。
17 条无终局评分尝试不当作零分或新增独立任务，不参与均分和成功率，另见 attempts.csv。
首胜后的曲线沿用成功分数，不表示复测；五条未解链只观察至 K10，K11–K17 不外推。
K0 为每任务一次，不同于六模型 v3 参考的每任务三次；任务数和观察窗口也不同。因此完整 K17 五轴、雷达面积及 Benchmark 预测值均缺失，不参与六模型的 MAE 或排名。
这里的成功率是 7 个任务内至少成功一次的比例，不是回合成功率或冻结能力。
重新生成：python3 scripts/import_gemini4.py <本地 Gemini 4 结果包目录>

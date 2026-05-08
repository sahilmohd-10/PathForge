import os

file_path = r'C:\Users\sahil\Downloads\COPY\pathforge---ai-career-navigator\src\server\routes\data.ts'
with open(file_path, 'r') as f:
    lines = f.readlines()

# Find the first export default router
for i, line in enumerate(lines):
    if 'export default router;' in line:
        # Keep everything up to this line (exclusive)
        new_lines = lines[:i]
        break
else:
    new_lines = lines

# Add the correct route and export
new_lines.append("\nrouter.get('/resume-status/:userId', async (req, res) => {\n")
new_lines.append("  try {\n")
new_lines.append("    const resume = await db('resume_data').where({ user_id: req.params.userId }).first();\n")
new_lines.append("    res.json({ exists: !!resume });\n")
new_lines.append("  } catch (error: any) {\n")
new_lines.append("    res.status(500).json({ error: error.message });\n")
new_lines.append("  }\n")
new_lines.append("});\n\n")
new_lines.append("export default router;\n")

with open(file_path, 'w') as f:
    f.writelines(new_lines)

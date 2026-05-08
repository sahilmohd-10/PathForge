import os

file_path = r'C:\Users\sahil\Downloads\COPY\pathforge---ai-career-navigator\src\server\routes\admin.ts'
with open(file_path, 'r') as f:
    content = f.read()

new_route = """
router.delete('/jobs/:id', isAdmin, async (req, res) => {
  try {
    await db.transaction(async (trx) => {
      await trx('applications').where({ job_id: req.params.id }).delete();
      await trx('jobs').where({ id: req.params.id }).delete();
    });

    res.json({ message: 'Job and associated applications deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
"""

if 'export default router;' in content:
    content = content.replace('export default router;', new_route + '\nexport default router;')

with open(file_path, 'w') as f:
    f.write(content)

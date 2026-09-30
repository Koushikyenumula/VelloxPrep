import os
import re

html_dir = 'c:\\OneDrive\\Desktop\\Ai-Interview Prep\\frontend'
button_pattern = re.compile(
    r'\s*<button[^>]*class="theme-toggle-btn"[^>]*>[\s\S]*?</button>',
    re.MULTILINE
)

count = 0
for root, _, files in os.walk(html_dir):
    for file in files:
        if file.endswith('.html'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            new_content = button_pattern.sub('', content)
            
            if new_content != content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                count += 1
                print(f'Updated {filepath}')
print(f'Total HTML files updated: {count}')

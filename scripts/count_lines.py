import os

def count_lines(directory):
    exclude_dirs = {'.git', 'node_modules', 'venv', '.venv', '__pycache__', 'build', 'dist', '.expo', 'ios', 'android'}
    extensions = {'.py', '.ts', '.tsx', '.js', '.jsx', '.json', '.html', '.css', '.md'}
    
    total_lines = 0
    file_count = 0
    
    # Dictionary to keep track of lines per file type
    lines_by_type = {ext: 0 for ext in extensions}
    
    for root, dirs, files in os.walk(directory):
        # Modify dirs in-place to prevent os.walk from visiting excluded directories
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        
        for file in files:
            ext = os.path.splitext(file)[1].lower()
            if ext in extensions:
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        lines = sum(1 for _ in f)
                        total_lines += lines
                        file_count += 1
                        lines_by_type[ext] += lines
                except UnicodeDecodeError:
                    # Skip files that can't be read as UTF-8
                    pass
                    
    return total_lines, file_count, lines_by_type

if __name__ == "__main__":
    directory = "."
    print(f"Počítám řádky ve složce: {os.path.abspath(directory)}...")
    total, files, by_type = count_lines(directory)
    
    print("-" * 30)
    print(f"Celkový počet souborů: {files}")
    print(f"Celkový počet řádků:   {total}")
    print("-" * 30)
    print("Rozdělení podle typu:")
    
    # Sort extensions by line count
    sorted_types = sorted(by_type.items(), key=lambda x: x[1], reverse=True)
    for ext, count in sorted_types:
        if count > 0:
            print(f"{ext:>6}: {count:>7} řádků")

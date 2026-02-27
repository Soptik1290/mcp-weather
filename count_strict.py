import os

def count_lines(directory):
    # Přísnější ignorování složek s vygenerovaným kódem a závislostmi
    exclude_dirs = {
        '.git', 'node_modules', 'venv', '.venv', '__pycache__', 
        'build', 'dist', '.expo', 'ios', 'android', '.next', '.bundle', 
        'coverage', '.vscode', '.github', 'public', 'assets', '__tests__'
    }
    
    # Ignorování specifických velkých souborů
    exclude_files = {
        'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'
    }
    
    # Počítáme jen skutečné zdrojové kódy tvé aplikace (bez .json)
    extensions = {'.py', '.ts', '.tsx', '.js', '.jsx', '.css', '.html', '.md'}
    
    total_lines = 0
    file_count = 0
    lines_by_type = {ext: 0 for ext in extensions}
    
    for root, dirs, files in os.walk(directory):
        # Filtrujeme složky
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        
        for file in files:
            if file in exclude_files:
                continue
                
            ext = os.path.splitext(file)[1].lower()
            if ext in extensions:
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        # Započítáme buď všechny řádky, nebo jen neprázdné.
                        # Nyní započítáme všechny řádky zdrojového kódu.
                        lines = sum(1 for line in f)
                        total_lines += lines
                        file_count += 1
                        lines_by_type[ext] += lines
                except UnicodeDecodeError:
                    pass
                    
    return total_lines, file_count, lines_by_type

if __name__ == "__main__":
    directory = "."
    print(f"Počítám VLASTNÍ zdrojový kód ve složce: {os.path.abspath(directory)}...")
    print("Ignoruji: node_modules, .next, .expo, build, dist, android, ios, lock soubory atd.")
    total, files, by_type = count_lines(directory)
    
    print("-" * 30)
    print(f"Celkový počet zdrojových souborů: {files}")
    print(f"Celkový počet řádků (vč. mezer): {total}")
    print("-" * 30)
    print("Rozdělení podle jazyka:")
    
    sorted_types = sorted(by_type.items(), key=lambda x: x[1], reverse=True)
    for ext, count in sorted_types:
        if count > 0:
            print(f"{ext:>6}: {count:>7} řádků")

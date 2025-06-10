#!/usr/bin/env python3
import zipfile
import os
import sys

def should_exclude_file(file_path):
    """Check if file should be excluded from ZIP"""
    exclude_files = {
        'package-lock.json',
        '.replit',
        'create_zip.py'
    }
    
    exclude_extensions = {
        '.log'
    }
    
    exclude_dirs = {
        'node_modules',
        '.git',
        '.cache',
        '.local',
        '.config',
        '.upm',
        '__pycache__'
    }
    
    # Check if any parent directory should be excluded
    path_parts = file_path.split(os.sep)
    for part in path_parts:
        if part in exclude_dirs:
            return True
    
    # Check filename
    filename = os.path.basename(file_path)
    if filename in exclude_files:
        return True
    
    # Check extension
    _, ext = os.path.splitext(filename)
    if ext in exclude_extensions:
        return True
        
    return False

def create_project_zip():
    """Create ZIP file of River Valley Conference website project"""
    zip_filename = 'river-valley-conference-website.zip'
    
    try:
        with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as zipf:
            file_count = 0
            
            for root, dirs, files in os.walk('.'):
                # Filter out excluded directories
                dirs[:] = [d for d in dirs if not should_exclude_file(os.path.join(root, d))]
                
                for file in files:
                    file_path = os.path.join(root, file)
                    
                    # Skip excluded files
                    if should_exclude_file(file_path):
                        continue
                    
                    # Create archive path (remove leading ./)
                    arc_path = os.path.relpath(file_path, '.')
                    if arc_path.startswith('./'):
                        arc_path = arc_path[2:]
                    
                    try:
                        zipf.write(file_path, arc_path)
                        file_count += 1
                        print(f"Added: {arc_path}")
                    except Exception as e:
                        print(f"Warning: Could not add {file_path}: {e}")
            
            print(f"\nZIP file created successfully: {zip_filename}")
            print(f"Total files included: {file_count}")
            
            # Get file size
            file_size = os.path.getsize(zip_filename)
            size_mb = file_size / (1024 * 1024)
            print(f"ZIP file size: {size_mb:.2f} MB")
            
    except Exception as e:
        print(f"Error creating ZIP file: {e}")
        sys.exit(1)

if __name__ == "__main__":
    create_project_zip()
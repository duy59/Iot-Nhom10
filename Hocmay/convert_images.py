import os
from pillow_heif import register_heif_opener
from PIL import Image

def convert_heic_to_jpg():
    # Đăng ký HEIF opener
    register_heif_opener()
    
    # Đường dẫn thư mục gốc
    base_dir = "Dataset"
    
    # Các category chính
    main_categories = ["co_trung", "khong_trung"]
    
    # Các subcategory cho "co_trung" (1 trứng, 2 trứng, 3 trứng)
    co_trung_subcategories = ["1_trung", "2_trung", "3-trung"]
    
    for category in main_categories:
        category_path = os.path.join(base_dir, category)
        
        if category == "co_trung":
            # Xử lý các subcategory trong co_trung
            for subcategory in co_trung_subcategories:
                subcategory_path = os.path.join(category_path, subcategory)
                
                # Tạo thư mục jpg tương ứng
                jpg_path = os.path.join(base_dir, "co_trung_jpg", subcategory)
                os.makedirs(jpg_path, exist_ok=True)
                
                # Chuyển đổi các file trong subcategory
                convert_files_in_directory(subcategory_path, jpg_path)
        else:
            # Xử lý category khong_trung
            jpg_path = os.path.join(base_dir, f"{category}_jpg")
            os.makedirs(jpg_path, exist_ok=True)
            
            # Chuyển đổi các file trong khong_trung
            convert_files_in_directory(category_path, jpg_path)

def convert_files_in_directory(source_dir, target_dir):
    """
    Hàm hỗ trợ chuyển đổi tất cả file HEIC trong một thư mục
    """
    if not os.path.exists(source_dir):
        print(f"Thư mục không tồn tại: {source_dir}")
        return
        
    for filename in os.listdir(source_dir):
        if filename.lower().endswith('.heic'):
            try:
                # Đường dẫn file gốc
                heic_path = os.path.join(source_dir, filename)
                
                # Đường dẫn file jpg mới
                jpg_filename = filename.rsplit('.', 1)[0] + '.jpg'
                jpg_file_path = os.path.join(target_dir, jpg_filename)
                
                # Chuyển đổi HEIC sang JPG
                heif_file = Image.open(heic_path)
                heif_file.convert('RGB').save(jpg_file_path, 'JPEG')
                
                print(f"Đã chuyển đổi: {filename} -> {jpg_filename}")
                
            except Exception as e:
                print(f"Lỗi khi chuyển đổi {filename}: {str(e)}")

if __name__ == "__main__":
    convert_heic_to_jpg()
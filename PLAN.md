# Working Flow
1. admin import ข้อมูลลงexcal
2. adminสร้างQRสำหรับสินค้า
3. ปรับแต่งQR
4. print QR แปะบนผลิตภัณฑ์
5. เมื่อลูกค้าสแกนสินค้าให้เก็บlogว่ามีคนเปิดหน้าสินค้า 

# DATA 
### User 
- id   int
- name varchar(200)
- surname  varchar(200)
- email    varchar(200)
- hash_passsword  varchar(500)

### products
- sku       varchar(200)
- name     varchar(200)
- category_id   int
- price     int
- size      varchar(500)
- type    enum(g,ml,ชิ้น)
- description varchar(500)
- how_to_use varchar(500)
- status enum(active,inactive)
- QR_products text
- create_at   timestamp
- update_at     timestamp

### products_category
- id int
- name varchar(200)

### products_photo
- id        int 
- product_id  int
- photo_url     text

### log_scan
- id
- product_id
- scan_at 

# Implement plan
- เช็คข้อมูลในExcal ก่อนลงdatabase
- import ข้อมูลจากexcalลงdatabase
- สร้างAPI สำหรับแก้ไขข้อมูลสินค้า
- สร้าง QR
- สร้างAPI สำหรับหน้าสินค้าสาธารณะ

# ตัดฟีเจอร์
- ฟีเจอร์การเชิญadminกับแยกrole เพราะหน้านี้คนที่ใช้ได้ก็มีแค่แอดมินอยู่แล้ว
# Assumption
- หน้าสำหรับรวมสินค้าที่มีในระบบทั้งหมดไว้เปิดactive incative
- มีหน้าแสดงว่าสินค้าตัวไหนถูกดูเยอะที่สุดในหน้าของsuper admin
- ต้องมีระบบตรวจเช็คข้อมูลในexcalว่า มีเลขติดลบหรือข้อมูลไม่ถูกต้องไหมถ้ามีให้ทำการแจ้งแล้วไม่อัพลงdatabase
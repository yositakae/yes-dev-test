## วิธีติดตั้งและรันระบบ พร้อมบัญชี Super Admin สำหรับทดสอบ

# backend
cd backend
npm run start:dev

# frontend
cd frontend
npm run dev

# Database
DATABASE_URL="postgresql://neondb_owner:npg_YPMvpwFc78NG@ep-frosty-dawn-az3izkn4-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# super admin



## Tech stack ที่เลือก และเหตุผลที่เลือก
NestJS
NextJS
Prisma


# ฟีเจอร์ที่ทำเสร็จ และที่ไม่เสร็จ
## ที่ทำเสร็จ
- บันทึกการสแกน
- ปรับแต่ง QR
- Import Excel
- หน้าสินค้าสาธารณะ
- อัปโหลดรูปสินค้า
- สร้าง QR
- แก้ไขข้อมูลสินค้า


# สิ่งที่ต่างจากแผนงาน และเหตุผลที่เปลี่ยน
- เพิ่ม Role ใน ตาราง user
- เพิ่มแผนงานสร้างapi สำหรับใส่excal เพื่อแก้ไขข้อมูล
- เพิ่มสมมติฐาน 
    - เพิ่มหน้าสำหรับแก้ไขข้อมูลสินค้าที่ผิดไว้ให้แอดมินแก้ไข
    - ทำfitterกรองสินค้าว่าสินค้าไหน inactive active
- แก้ฐานข้อมูลuser ไม่เก็บชื่อนามสกุล
- เพิ่มuser_roles ใช้เก็บสิทธิ์ของผู้ใช้
- เพิ่ม user_invitations ใช้เก็บคำเชิญ Admin

การใช้ AI: ใช้ทำอะไรบ้าง, ตัวอย่าง prompt อย่างน้อย 3 ตัวอย่าง, AI ผิดพลาดตรงไหนและแก้อย่างไร, ส่วนไหนเขียนเองทั้งหมด
- 
- 
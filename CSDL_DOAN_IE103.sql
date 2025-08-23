CREATE DATABASE DOAN_QLTT


CREATE TABLE Tai_khoan (
	ma_tai_khoan VARCHAR(20) PRIMARY KEY,
	ten_dang_nhap VARCHAR(50) NOT NULL,
	mat_khau VARCHAR(255) NOT NULL,
	loai_tai_khoan VARCHAR(2) NOT NULL CHECK (loai_tai_khoan IN ('KH', 'NV', 'QL'))
);

CREATE TABLE Khach_hang (
	ma_khach_hang VARCHAR(20) PRIMARY KEY ,
	ten_khach_hang VARCHAR(100) NOT NULL,
	dia_chi VARCHAR(255),
	so_dien_thoai VARCHAR(15),
	ngay_dang_ki DATETIME DEFAULT GETDATE(),
	ma_tai_khoan VARCHAR(20),
	FOREIGN KEY (ma_tai_khoan) REFERENCES Tai_khoan(ma_tai_khoan),
);

CREATE TABLE Loai_san_pham (
	ma_loai INT PRIMARY KEY ,
	ten_loai VARCHAR(100) NOT NULL
);

CREATE TABLE Nha_cung_cap (
	ma_nha_cung_cap VARCHAR(20) PRIMARY KEY,
	ten_nha_cung_cap VARCHAR(100) NOT NULL,
	dia_chi VARCHAR(255),
	so_dien_thoai VARCHAR(15)
);

CREATE TABLE San_pham (
	ma_san_pham INT PRIMARY KEY ,
	ten_san_pham VARCHAR(100) NOT NULL,
	gia DECIMAL(10, 2) NOT NULL,
	so_luong INT NOT NULL DEFAULT 0,
	ma_loai INT,
	tinh_nang_noi_bat VARCHAR(500),
	noi_bat BIT DEFAULT 0,
	hinh_anh VARCHAR(255),
	thuong_hieu VARCHAR(100),
	mo_ta VARCHAR(1000),
	cua_hang_co_san VARCHAR(255),
	FOREIGN KEY (ma_loai) REFERENCES Loai_san_pham(ma_loai),
);

CREATE TABLE Nguoi_quan_ly (
	ma_quan_ly VARCHAR(20) PRIMARY KEY,
	ten_quan_ly VARCHAR(100) NOT NULL,
	dia_chi VARCHAR(255),
	so_dien_thoai VARCHAR(15),
	ngay_vao_lam DATETIME DEFAULT GETDATE(),
	ma_tai_khoan VARCHAR(20),
	FOREIGN KEY (ma_tai_khoan) REFERENCES Tai_khoan(ma_tai_khoan)
);



CREATE TABLE Nhan_vien (
	ma_nhan_vien VARCHAR(20) PRIMARY KEY,
	ten_nhan_vien VARCHAR(100) NOT NULL,
	ngay_vao_lam DATETIME DEFAULT GETDATE(),
	dia_chi VARCHAR(255),
	so_dien_thoai VARCHAR(15),
	ma_tai_khoan VARCHAR(20),
	FOREIGN KEY (ma_tai_khoan) REFERENCES Tai_khoan(ma_tai_khoan),
);


CREATE TABLE Hoa_don (
	ma_hoa_don INT PRIMARY KEY ,
	ma_khach_hang VARCHAR(20),
	ma_nhan_vien VARCHAR(20),
	ngay_lap DATETIME DEFAULT GETDATE(),
	tong_tien DECIMAL(10, 2),
	FOREIGN KEY (ma_khach_hang) REFERENCES Khach_hang(ma_khach_hang),
	FOREIGN KEY (ma_nhan_vien) REFERENCES Nhan_vien(ma_nhan_vien),
);

CREATE TABLE Chi_tiet_hoa_don (
	ma_hoa_don INT,
	ma_san_pham INT,
	so_luong INT NOT NULL DEFAULT 1,
	don_gia DECIMAL(10, 2) NOT NULL,
	PRIMARY KEY (ma_hoa_don, ma_san_pham),
	FOREIGN KEY (ma_hoa_don) REFERENCES Hoa_don(ma_hoa_don),
	FOREIGN KEY (ma_san_pham) REFERENCES San_pham(ma_san_pham)
);

CREATE TABLE Gio_hang (
	ma_san_pham INT,
	ma_khach_hang VARCHAR(20),
	so_luong INT NOT NULL DEFAULT 1,
	PRIMARY KEY (ma_san_pham, ma_khach_hang),
	FOREIGN KEY (ma_san_pham) REFERENCES San_pham(ma_san_pham),
	FOREIGN KEY (ma_khach_hang) REFERENCES Khach_hang(ma_khach_hang)
);
CREATE TABLE Thong_tin_danh_gia (
	ma_san_pham INT,
	ten_nguoi_gui VARCHAR(100),
	email  VARCHAR(255),
	noi_dung VARCHAR(1000),
	ngay_danh_gia DATETIME DEFAULT GETDATE(),
	so_sao INT CHECK (so_sao BETWEEN 1 AND 5),
	PRIMARY KEY (ma_san_pham, email),
	FOREIGN KEY (ma_san_pham) REFERENCES San_pham(ma_san_pham)
);

CREATE TABLE Nguon_cung_cap (
	ma_nha_cung_cap VARCHAR(20),
	ma_san_pham INT,
	FOREIGN KEY (ma_san_pham) REFERENCES San_pham(ma_san_pham),
	FOREIGN KEY (ma_nha_cung_cap) REFERENCES Nha_cung_cap(ma_nha_cung_cap)
)


INSERT INTO tai_khoan (ma_tai_khoan, ten_dang_nhap, mat_khau, loai_tai_khoan) VALUES
('QL009','QL1','pass123','QL'),
('QL010','QL3','pass123567','QL'),
('QL011','QL4','pass1230','QL'),
('NV009','nv1','pass123','NV'),
('NV010','nv2','pass123','NV'),
('NV008','nv3','pass123','NV'),
('KH007','kh1','mk123','KH'),
('KH008','kh1','mk123','KH'),
('KH005', 'user3', 'pass789', 'KH'),
('KH006', 'user4', 'pass101', 'KH'),
('NV007', 'nv2', 'nv456', 'NV'),
('QL008', 'ql2', 'ql789', 'QL')


INSERT INTO Khach_hang (ma_khach_hang, ten_khach_hang, dia_chi, so_dien_thoai, ngay_dang_ki, ma_tai_khoan) VALUES
('KH3', 'Phạm Thị C', '789 Trần Hưng Đạo, Đà Nẵng', '0923456789', '2023-04-10', 'KH005'),
('KH4', 'Hoàng Văn D', '101 Lê Lợi, Huế', '0934567890', '2023-05-15', 'KH006'),
('KH5', 'Lê Thị E', '234 Phạm Văn Đồng, Hà Nội', '0945678901', '2023-06-20', 'KH007'),
('KH6', 'Ngô Văn F', '567 Nguyễn Huệ, TP.HCM', '0956789012', '2023-07-25', 'KH008');

INSERT INTO Loai_san_pham (ma_loai, ten_loai) VALUES
(5, 'Tai nghe'),
(6, 'Máy ảnh'),
(7, 'Đồng hồ thông minh'),
(8, 'Loa Bluetooth');

INSERT INTO Nha_cung_cap (ma_nha_cung_cap, ten_nha_cung_cap, dia_chi, so_dien_thoai) VALUES
(3, 'Sony Vietnam', '123 Lê Lợi, TP.HCM', '0967890123'),
(4, 'Xiaomi Vietnam', '456 Trần Phú, Hà Nội', '0978901234'),
(5, 'JBL Vietnam', '789 Nguyễn Huệ, Đà Nẵng', '0989012345'),
(6, 'Canon Vietnam', '101 Phạm Văn Đồng, Huế', '0990123456');

INSERT INTO San_pham (ma_san_pham, ten_san_pham, gia, so_luong, ma_loai, tinh_nang_noi_bat, noi_bat, hinh_anh, thuong_hieu, mo_ta, cua_hang_co_san) VALUES
(404, 'Sony WH-1000XM5', 8490000.00, 25, 5, 'Chống ồn chủ động, âm thanh Hi-Res', 1, '/pics/headphone-1.jpg', 'Sony', 'Tai nghe Sony WH-1000XM5', 'Đà Nẵng' ),
(405, 'Xiaomi 13 Pro', 19990000.00, 30, 7, 'Snapdragon 8 Gen 2, camera Leica', 1, '/pics/phone-2.jpg', 'Xiaomi', 'Xiaomi 13 Pro 5G', 'Huế'),
(406, 'JBL Charge 5', 4990000.00, 20, 8, 'Âm thanh mạnh mẽ, chống nước IP67', 0, '/pics/speaker-1.jpg', 'JBL', 'Loa Bluetooth JBL Charge 5', 'Hải Phòng'),
(407, 'Canon EOS R50', 18990000.00, 10, 6, 'Cảm biến APS-C, quay video 4K', 1, '/pics/camera-1.jpg', 'Canon', 'Máy ảnh Canon EOS R50', 'Cần Thơ');

INSERT INTO Nhan_vien (ma_nhan_vien, ten_nhan_vien, ngay_vao_lam, ma_tai_khoan, dia_chi, so_dien_thoai) VALUES
('NV1', 'Trần Văn G', '2022-07-01', 'NV007', '123 Trần Phú, Hà Nội', '0961234567'),
('NV2', 'Nguyễn Thị H', '2022-08-15', 'NV008', '456 Lê Lợi, TP.HCM', '0972345678'),
('NV3', 'Phạm Văn I', '2022-09-20', 'NV009', '789 Nguyễn Huệ, Đà Nẵng', '0983456789'),
('NV4', 'Lê Văn J', '2022-10-25', 'NV010', '101 Phạm Văn Đồng, Huế', '0994567890');

INSERT INTO Nguoi_quan_ly (ma_quan_ly, ten_quan_ly, dia_chi, so_dien_thoai,ngay_vao_lam, ma_tai_khoan) VALUES
('QL1', 'Nguyễn Văn K', '234 Trần Hưng Đạo, Hà Nội', '0915678901','2020-07-01', 'QL008'),
('QL2', 'Trần Thị L', '567 Lê Lợi, TP.HCM', '0926789012','2021-01-02', 'QL009'),
('QL3', 'Phạm Văn M', '789 Nguyễn Huệ, Đà Nẵng', '0937890123','2025-04-20', 'QL010'),
('QL4', 'Lê Thị N', '101 Phạm Văn Đồng, Huế', '0948901234','2022-03-21', 'QL011');

INSERT INTO Hoa_don (ma_hoa_don, ma_khach_hang, ma_nhan_vien, ngay_lap, tong_tien) VALUES
(3, 'KH3', 'NV1', '2023-08-01', 16980000),
(4, 'KH4', 'NV2', '2023-08-02', 19990000),
(5, 'KH5', 'NV3', '2023-08-03', 9980000),
(6, 'KH6', 'NV4', '2023-08-04', 18990000);

INSERT INTO Chi_tiet_hoa_don (ma_hoa_don, ma_san_pham, so_luong, don_gia) VALUES
(3, 404, 2, 8490000),
(4, 405, 1, 19990000),
(5, 406, 2, 4990000),
(6, 407, 1, 18990000);

INSERT INTO Thong_tin_danh_gia(ten_nguoi_gui, email, noi_dung, ngay_danh_gia, so_sao, ma_san_pham) VALUES
('Trần Văn H', 'h.tran@gmail.com', 'Sản phẩm rất tốt, giao hàng nhanh!', '2024-06-01 00:00:00', 5, 405),
('Nguyễn Thị I', 'i.nguyen@gmail.com', 'Máy đẹp, pin lâu, rất hài lòng.', '2024-06-02 00:00:00', 4, 406),
('Lê Văn K', 'k.le@gmail.com', 'Tai nghe âm thanh tốt, nhưng giá hơi cao.', '2024-06-03 00:00:00', 4, 404),
('Phạm Thị L', 'l.pham@gmail.com', 'Máy ảnh chụp nét, dễ sử dụng.', '2024-06-04 00:00:00', 5, 407);

INSERT INTO Gio_hang (ma_khach_hang,ma_san_pham, so_luong) VALUES
('KH3',404, 3),
('KH4',405, 2),
('KH5',406, 4),
('KH6',407, 2);

INSERT INTO Nguon_cung_cap(ma_san_pham,ma_nha_cung_cap) VALUES
(404,3),
(405,4),
(406,5),
(407,6)

INSERT INTO Tai_khoan (ma_tai_khoan, ten_dang_nhap, mat_khau, loai_tai_khoan) VALUES
('KH009', 'khachhang1', 'passkh001', 'KH'),
('KH010', 'khachhang2', 'passkh002', 'KH'),
('KH011', 'khachhang3', 'passkh003', 'KH'),
('KH012', 'khachhang4', 'passkh004', 'KH'),
('KH013', 'khachhang5', 'passkh005', 'KH'),
('KH014', 'khachhang6', 'passkh006', 'KH'),
('KH015', 'khachhang7', 'passkh007', 'KH'),
('KH016', 'khachhang8', 'passkh008', 'KH'),
('KH017', 'khachhang9', 'passkh009', 'KH'),
('KH018', 'khachhang10', 'passkh010', 'KH'),
('NV011', 'nhanvien1', 'passnv001', 'NV'),
('NV012', 'nhanvien2', 'passnv002', 'NV'),
('NV013', 'nhanvien3', 'passnv003', 'NV'),
('NV014', 'nhanvien4', 'passnv004', 'NV'),
('NV015', 'nhanvien5', 'passnv005', 'NV'),
('NV016', 'nhanvien6', 'passnv006', 'NV'),
('NV017', 'nhanvien7', 'passnv007', 'NV'),
('NV018', 'nhanvien8', 'passnv008', 'NV'),
('NV019', 'nhanvien9', 'passnv009', 'NV'),
('NV020', 'nhanvien10', 'passnv010', 'NV'),
('QL012', 'quanly1', 'passql001', 'QL'),
('QL013', 'quanly2', 'passql002', 'QL'),
('QL014', 'quanly3', 'passql003', 'QL'),
('QL015', 'quanly4', 'passql004', 'QL'),
('QL016', 'quanly5', 'passql005', 'QL'),
('QL017', 'quanly6', 'passql006', 'QL'),
('QL018', 'quanly7', 'passql007', 'QL'),
('QL019', 'quanly8', 'passql008', 'QL'),
('QL020', 'quanly9', 'passql009', 'QL'),
('QL021', 'quanly10', 'passql010', 'QL');

INSERT INTO Khach_hang (ma_khach_hang, ten_khach_hang, dia_chi, so_dien_thoai, ngay_dang_ki, ma_tai_khoan) VALUES
('KH007', 'Nguyễn Văn A', '123 Nguyễn Trãi, Hà Nội', '0912345671', '2024-01-01', 'KH009'),
('KH008', 'Trần Thị B', '456 Lê Đại Hành, TP.HCM', '0912345672', '2024-01-02', 'KH010'),
('KH009', 'Phạm Văn C', '789 Phạm Ngũ Lão, Đà Nẵng', '0912345673', '2024-01-03', 'KH011'),
('KH010', 'Lê Thị D', '101 Nguyễn Huệ, Huế', '0912345674', '2024-01-04', 'KH012'),
('KH011', 'Hoàng Văn E', '234 Trần Phú, Hải Phòng', '0912345675', '2024-01-05', 'KH013'),
('KH012', 'Ngô Thị F', '567 Lê Lợi, Cần Thơ', '0912345676', '2024-01-06', 'KH014'),
('KH013', 'Võ Văn G', '789 Hùng Vương, Nha Trang', '0912345677', '2024-01-07', 'KH015'),
('KH014', 'Đỗ Thị H', '101 Hai Bà Trưng, Hà Nội', '0912345678', '2024-01-08', 'KH016'),
('KH015', 'Bùi Văn I', '123 Lê Duẩn, TP.HCM', '0912345679', '2024-01-09', 'KH017'),
('KH016', 'Lý Thị K', '456 Nguyễn Đình Chiểu, Đà Nẵng', '0912345680', '2024-01-10', 'KH018'),
('KH017', 'Trương Văn L', '789 Trần Hưng Đạo, Huế', '0912345681', '2024-01-11', 'KH009'),
('KH018', 'Nguyễn Thị M', '101 Phạm Văn Đồng, Hải Phòng', '0912345682', '2024-01-12', 'KH010'),
('KH019', 'Phan Văn N', '234 Lê Lợi, Cần Thơ', '0912345683', '2024-01-13', 'KH011'),
('KH020', 'Lê Văn O', '567 Nguyễn Huệ, Nha Trang', '0912345684', '2024-01-14', 'KH012'),
('KH021', 'Trần Thị P', '789 Hùng Vương, Hà Nội', '0912345685', '2024-01-15', 'KH013'),
('KH022', 'Phạm Văn Q', '101 Trần Phú, TP.HCM', '0912345686', '2024-01-16', 'KH014'),
('KH023', 'Ngô Thị R', '123 Lê Đại Hành, Đà Nẵng', '0912345687', '2024-01-17', 'KH015'),
('KH024', 'Võ Văn S', '456 Phạm Ngũ Lão, Huế', '0912345688', '2024-01-18', 'KH016'),
('KH025', 'Đỗ Thị T', '789 Nguyễn Trãi, Hải Phòng', '0912345689', '2024-01-19', 'KH017'),
('KH026', 'Bùi Văn U', '101 Lê Duẩn, Cần Thơ', '0912345690', '2024-01-20', 'KH018');


INSERT INTO Loai_san_pham (ma_loai, ten_loai) VALUES
(9, 'Điện thoại thông minh'),
(10, 'Laptop'),
(11, 'Phụ kiện điện tử'),
(12, 'Máy tính bảng'),
(13, 'Camera giám sát');


INSERT INTO Nha_cung_cap (ma_nha_cung_cap, ten_nha_cung_cap, dia_chi, so_dien_thoai) VALUES
('NCC007', 'Samsung Vietnam', '234 Nguyễn Trãi, Hà Nội', '0961234567'),
('NCC008', 'Apple Vietnam', '567 Lê Đại Hành, TP.HCM', '0972345678'),
('NCC009', 'Anker Vietnam', '789 Phạm Ngũ Lão, Đà Nẵng', '0983456789'),
('NCC010', 'Lenovo Vietnam', '101 Nguyễn Huệ, Huế', '0994567890'),
('NCC011', 'Hikvision Vietnam', '123 Trần Phú, Hải Phòng', '0915678901');


INSERT INTO San_pham (ma_san_pham, ten_san_pham, gia, so_luong, ma_loai, tinh_nang_noi_bat, noi_bat, hinh_anh, thuong_hieu, mo_ta, cua_hang_co_san) VALUES
(408, 'Samsung Galaxy S23', 22990000.00, 15, 9, 'Snapdragon 8 Gen 2, màn hình AMOLED', 1, '/pics/phone-3.jpg', 'Samsung', 'Điện thoại Samsung Galaxy S23', 'Hà Nội'),
(409, 'iPhone 14 Pro', 27990000.00, 20, 9, 'Chip A16 Bionic, camera 48MP', 1, '/pics/phone-4.jpg', 'Apple', 'Điện thoại iPhone 14 Pro', 'TP.HCM'),
(410, 'Lenovo ThinkPad X1', 34990000.00, 10, 10, 'Core i7, 16GB RAM', 0, '/pics/laptop-1.jpg', 'Lenovo', 'Laptop Lenovo ThinkPad X1 Carbon', 'Đà Nẵng'),
(411, 'Anker PowerBank 20000', 1290000.00, 50, 11, 'Sạc nhanh 20W, dung lượng lớn', 0, '/pics/powerbank-1.jpg', 'Anker', 'Pin dự phòng Anker 20000mAh', 'Huế'),
(412, 'iPad Air 5', 15990000.00, 25, 12, 'Chip M1, màn hình Liquid Retina', 1, '/pics/tablet-1.jpg', 'Apple', 'Máy tính bảng iPad Air 5', 'Hải Phòng'),
(413, 'Hikvision DS-2CD1023', 2990000.00, 30, 13, 'Camera Full HD, hồng ngoại 30m', 0, '/pics/camera-2.jpg', 'Hikvision', 'Camera giám sát Hikvision', 'Cần Thơ'),
(414, 'Sony WF-1000XM4', 6490000.00, 20, 5, 'Chống ồn chủ động, âm thanh TWS', 1, '/pics/headphone-2.jpg', 'Sony', 'Tai nghe Sony WF-1000XM4', 'Nha Trang'),
(415, 'Xiaomi Mi Band 8', 990000.00, 40, 7, 'Màn hình AMOLED, theo dõi sức khỏe', 0, '/pics/watch-1.jpg', 'Xiaomi', 'Đồng hồ thông minh Xiaomi Mi Band 8', 'Hà Nội'),
(416, 'JBL Flip 6', 3490000.00, 25, 8, 'Âm thanh sống động, chống nước IPX7', 0, '/pics/speaker-2.jpg', 'JBL', 'Loa Bluetooth JBL Flip 6', 'TP.HCM'),
(417, 'Canon EOS M50', 14990000.00, 15, 6, 'Cảm biến APS-C, quay video 4K', 1, '/pics/camera-3.jpg', 'Canon', 'Máy ảnh Canon EOS M50', 'Đà Nẵng'),
(418, 'Samsung Galaxy A54', 8990000.00, 30, 9, 'Exynos 1380, màn hình Super AMOLED', 0, '/pics/phone-5.jpg', 'Samsung', 'Điện thoại Samsung Galaxy A54', 'Huế'),
(419, 'MacBook Air M2', 29990000.00, 10, 10, 'Chip M2, màn hình Retina', 1, '/pics/laptop-2.jpg', 'Apple', 'Laptop MacBook Air M2', 'Hải Phòng'),
(420, 'Anker Soundcore Q30', 1990000.00, 35, 5, 'Chống ồn chủ động, pin 40 giờ', 0, '/pics/headphone-3.jpg', 'Anker', 'Tai nghe Anker Soundcore Q30', 'Cần Thơ'),
(421, 'iPad Pro 11', 23990000.00, 15, 12, 'Chip M2, màn hình ProMotion', 1, '/pics/tablet-2.jpg', 'Apple', 'Máy tính bảng iPad Pro 11 inch', 'Nha Trang'),
(422, 'Hikvision DS-2CD2043', 3990000.00, 20, 13, 'Camera 4MP, chống nước IP67', 0, '/pics/camera-4.jpg', 'Hikvision', 'Camera giám sát Hikvision 4MP', 'Hà Nội'),
(423, 'Sony SRS-XB43', 5490000.00, 25, 8, 'Âm thanh Extra Bass, đèn LED', 0, '/pics/speaker-3.jpg', 'Sony', 'Loa Bluetooth Sony SRS-XB43', 'TP.HCM'),
(424, 'Xiaomi 12T', 12990000.00, 20, 9, 'Dimensity 8100, camera 108MP', 1, '/pics/phone-6.jpg', 'Xiaomi', 'Điện thoại Xiaomi 12T', 'Đà Nẵng'),
(425, 'Lenovo Yoga 7i', 26990000.00, 10, 10, 'Core i5, màn hình cảm ứng', 0, '/pics/laptop-3.jpg', 'Lenovo', 'Laptop Lenovo Yoga 7i', 'Huế'),
(426, 'Anker PowerCore 10000', 790000.00, 50, 11, 'Sạc nhanh 18W, nhỏ gọn', 0, '/pics/powerbank-2.jpg', 'Anker', 'Pin dự phòng Anker 10000mAh', 'Hải Phòng'),
(427, 'Samsung Galaxy Tab S8', 18990000.00, 15, 12, 'Snapdragon 8 Gen 1, màn hình 120Hz', 1, '/pics/tablet-3.jpg', 'Samsung', 'Máy tính bảng Samsung Galaxy Tab S8', 'Cần Thơ');


INSERT INTO Nhan_vien (ma_nhan_vien, ten_nhan_vien, ngay_vao_lam, ma_tai_khoan, dia_chi, so_dien_thoai) VALUES
('NV005', 'Nguyễn Văn V', '2024-02-01', 'NV011', '234 Nguyễn Trãi, Hà Nội', '0912345691'),
('NV006', 'Trần Thị W', '2024-02-02', 'NV012', '567 Lê Đại Hành, TP.HCM', '0912345692'),
('NV007', 'Phạm Văn X', '2024-02-03', 'NV013', '789 Phạm Ngũ Lão, Đà Nẵng', '0912345693'),
('NV008', 'Lê Thị Y', '2024-02-04', 'NV014', '101 Nguyễn Huệ, Huế', '0912345694'),
('NV009', 'Hoàng Văn Z', '2024-02-05', 'NV015', '123 Trần Phú, Hải Phòng', '0912345695'),
('NV010', 'Ngô Thị A1', '2024-02-06', 'NV016', '456 Lê Lợi, Cần Thơ', '0912345696'),
('NV011', 'Võ Văn B1', '2024-02-07', 'NV017', '789 Hùng Vương, Nha Trang', '0912345697'),
('NV012', 'Đỗ Thị C1', '2024-02-08', 'NV018', '101 Hai Bà Trưng, Hà Nội', '0912345698'),
('NV013', 'Bùi Văn D1', '2024-02-09', 'NV019', '123 Lê Duẩn, TP.HCM', '0912345699'),
('NV014', 'Lý Thị E1', '2024-02-10', 'NV020', '456 Nguyễn Đình Chiểu, Đà Nẵng', '0912345700');


INSERT INTO Nguoi_quan_ly (ma_quan_ly, ten_quan_ly, dia_chi, so_dien_thoai, ngay_vao_lam, ma_tai_khoan) VALUES
('QL005', 'Trương Văn F1', '789 Trần Hưng Đạo, Huế', '0912345701', '2023-03-01', 'QL012'),
('QL006', 'Nguyễn Thị G1', '101 Phạm Văn Đồng, Hải Phòng', '0912345702', '2023-03-02', 'QL013'),
('QL007', 'Phan Văn H1', '234 Lê Lợi, Cần Thơ', '0912345703', '2023-03-03', 'QL014'),
('QL008', 'Lê Văn I1', '567 Nguyễn Huệ, Nha Trang', '0912345704', '2023-03-04', 'QL015'),
('QL009', 'Trần Thị J1', '789 Hùng Vương, Hà Nội', '0912345705', '2023-03-05', 'QL016'),
('QL010', 'Phạm Văn K1', '101 Trần Phú, TP.HCM', '0912345706', '2023-03-06', 'QL017'),
('QL011', 'Ngô Thị L1', '123 Lê Đại Hành, Đà Nẵng', '0912345707', '2023-03-07', 'QL018'),
('QL012', 'Võ Văn M1', '456 Phạm Ngũ Lão, Huế', '0912345708', '2023-03-08', 'QL019'),
('QL013', 'Đỗ Thị N1', '789 Nguyễn Trãi, Hải Phòng', '0912345709', '2023-03-09', 'QL020'),
('QL014', 'Bùi Văn O1', '101 Lê Duẩn, Cần Thơ', '0912345710', '2023-03-10', 'QL021');


INSERT INTO Hoa_don (ma_hoa_don, ma_khach_hang, ma_nhan_vien, ngay_lap, tong_tien) VALUES
(7, 'KH007', 'NV005', '2024-03-01', 68970000.00),
(8, 'KH008', 'NV006', '2024-03-02', 2580000.00),
(9, 'KH009', 'NV007', '2024-03-03', 31980000.00),
(10, 'KH010', 'NV008', '2024-03-04', 9980000.00),
(11, 'KH011', 'NV009', '2024-03-05', 47970000.00),
(12, 'KH012', 'NV010', '2024-03-06', 5980000.00),
(13, 'KH013', 'NV011', '2024-03-07', 25980000.00),
(14, 'KH014', 'NV012', '2024-03-08', 14990000.00),
(15, 'KH015', 'NV013', '2024-03-09', 12990000.00),
(16, 'KH016', 'NV014', '2024-03-10', 29990000.00),
(17, 'KH017', 'NV005', '2024-03-11', 7980000.00),
(18, 'KH018', 'NV006', '2024-03-12', 37980000.00),
(19, 'KH019', 'NV007', '2024-03-13', 1990000.00),
(20, 'KH020', 'NV008', '2024-03-14', 23990000.00),
(21, 'KH021', 'NV009', '2024-03-15', 3490000.00),
(22, 'KH022', 'NV010', '2024-03-16', 18990000.00),
(23, 'KH023', 'NV011', '2024-03-17', 12990000.00),
(24, 'KH024', 'NV012', '2024-03-18', 26990000.00),
(25, 'KH025', 'NV013', '2024-03-19', 790000.00),
(26, 'KH026', 'NV014', '2024-03-20', 18990000.00);


INSERT INTO Chi_tiet_hoa_don (ma_hoa_don, ma_san_pham, so_luong, don_gia) VALUES
(7, 408, 3, 22990000.00),
(8, 411, 2, 1290000.00),
(9, 409, 1, 27990000.00),
(10, 406, 2, 4990000.00),
(11, 412, 3, 15990000.00),
(12, 416, 2, 3490000.00),
(13, 414, 4, 6490000.00),
(14, 417, 1, 14990000.00),
(15, 424, 1, 12990000.00),
(16, 419, 1, 29990000.00),
(17, 420, 4, 1990000.00),
(18, 421, 2, 23990000.00),
(19, 411, 1, 1290000.00),
(20, 412, 1, 15990000.00),
(21, 416, 1, 3490000.00),
(22, 427, 1, 18990000.00),
(23, 424, 1, 12990000.00),
(24, 425, 1, 26990000.00),
(25, 426, 1, 790000.00),
(26, 427, 1, 18990000.00);


INSERT INTO Gio_hang (ma_khach_hang, ma_san_pham, so_luong) VALUES
('KH007', 408, 2),
('KH008', 409, 1),
('KH009', 410, 3),
('KH010', 411, 4),
('KH011', 412, 2),
('KH012', 413, 1),
('KH013', 414, 3),
('KH014', 415, 2),
('KH015', 416, 1),
('KH016', 417, 2),
('KH017', 418, 3),
('KH018', 419, 1),
('KH019', 420, 2),
('KH020', 421, 1),
('KH021', 422, 2),
('KH022', 423, 3),
('KH023', 424, 1),
('KH024', 425, 1),
('KH025', 426, 2),
('KH026', 427, 1);


INSERT INTO Thong_tin_danh_gia (ten_nguoi_gui, email, noi_dung, ngay_danh_gia, so_sao, ma_san_pham) VALUES
('Nguyễn Văn P', 'p.nguyen@gmail.com', 'Điện thoại rất mượt, đáng giá.', '2024-07-01', 5, 408),
('Trần Thị Q', 'q.tran@gmail.com', 'Pin hơi yếu, còn lại tốt.', '2024-07-02', 3, 409),
('Phạm Văn R', 'r.pham@gmail.com', 'Laptop mạnh, thiết kế đẹp.', '2024-07-03', 4, 410),
('Lê Thị S', 's.le@gmail.com', 'Pin dự phòng sạc nhanh, tiện lợi.', '2024-07-04', 5, 411),
('Hoàng Văn T', 't.hoang@gmail.com', 'Máy tính bảng mượt, màn hình đẹp.', '2024-07-05', 5, 412),
('Ngô Thị U', 'u.ngo@gmail.com', 'Camera chất lượng, dễ lắp đặt.', '2024-07-06', 4, 413),
('Võ Văn V', 'v.vo@gmail.com', 'Tai nghe âm thanh tốt, đeo thoải mái.', '2024-07-07', 4, 414),
('Đỗ Thị W', 'w.do@gmail.com', 'Đồng hồ thông minh tiện ích.', '2024-07-08', 4, 415),
('Bùi Văn X', 'x.bui@gmail.com', 'Loa âm thanh hay, pin lâu.', '2024-07-09', 5, 416),
('Lý Thị Y', 'y.ly@gmail.com', 'Máy ảnh chụp đẹp, dễ sử dụng.', '2024-07-10', 5, 417),
('Trương Văn Z', 'z.truong@gmail.com', 'Điện thoại ổn, giá hợp lý.', '2024-07-11', 4, 418),
('Nguyễn Thị A1', 'a1.nguyen@gmail.com', 'Laptop mạnh, nhưng hơi nặng.', '2024-07-12', 3, 419),
('Phan Văn B1', 'b1.phan@gmail.com', 'Tai nghe chất lượng, chống ồn tốt.', '2024-07-13', 5, 420),
('Lê Văn C1', 'c1.le@gmail.com', 'Máy tính bảng mạnh, đáng mua.', '2024-07-14', 5, 421),
('Trần Thị D1', 'd1.tran@gmail.com', 'Camera giám sát rõ nét, ổn định.', '2024-07-15', 4, 422),
('Phạm Văn E1', 'e1.pham@gmail.com', 'Loa bass mạnh, thiết kế đẹp.', '2024-07-16', 5, 423),
('Ngô Thị F1', 'f1.ngo@gmail.com', 'Điện thoại camera đẹp, hiệu năng tốt.', '2024-07-17', 4, 424),
('Võ Văn G1', 'g1.vo@gmail.com', 'Laptop mượt, phù hợp công việc.', '2024-07-18', 4, 425),
('Đỗ Thị H1', 'h1.do@gmail.com', 'Pin dự phòng nhỏ gọn, tiện lợi.', '2024-07-19', 5, 426),
('Bùi Văn I1', 'i1.bui@gmail.com', 'Máy tính bảng hiệu năng cao.', '2024-07-20', 5, 427);


INSERT INTO Nguon_cung_cap (ma_san_pham, ma_nha_cung_cap) VALUES
(408, 'NCC007'),
(409, 'NCC008'),
(410, 'NCC010'),
(411, 'NCC009'),
(412, 'NCC008'),
(413, 'NCC011'),
(414, 'NCC007'),
(415, 'NCC007'),
(416, 'NCC011'),
(417, 'NCC011'),
(418, 'NCC007'),
(419, 'NCC008'),
(420, 'NCC009'),
(421, 'NCC008'),
(422, 'NCC011'),
(423, 'NCC010'),
(424, 'NCC010'),
(425, 'NCC010'),
(426, 'NCC009'),
(427, 'NCC007');

SELECT * FROM Tai_khoan;
SELECT * FROM Khach_hang;
SELECT * FROM Loai_san_pham;
SELECT * FROM Nha_cung_cap;
SELECT * FROM San_pham;
SELECT * FROM Nhan_vien;
SELECT * FROM Nguoi_quan_ly;
SELECT * FROM Hoa_don;
SELECT * FROM Chi_tiet_hoa_don;
SELECT * FROM Gio_hang;
SELECT * FROM Thong_tin_danh_gia;
SELECT * FROM Nguon_cung_cap;
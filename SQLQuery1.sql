CREATE DATABASE IE103
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
	ma_loai INT PRIMARY KEY IDENTITY(1,1),
	ten_loai VARCHAR(100) NOT NULL
);

CREATE TABLE Nha_cung_cap (
	ma_nha_cung_cap VARCHAR(20) PRIMARY KEY,
	ten_nha_cung_cap VARCHAR(100) NOT NULL,
	dia_chi VARCHAR(255),
	so_dien_thoai VARCHAR(15)
);

CREATE TABLE San_pham (
	ma_san_pham INT PRIMARY KEY IDENTITY(1,1),
	ten_san_pham VARCHAR(100) NOT NULL,
	gia DECIMAL(10, 2) NOT NULL,
	so_luong INT NOT NULL DEFAULT 0,
	ma_nha_cung_cap VARCHAR(20),
	ma_loai INT,
	tinh_nang_noi_bat VARCHAR(500),
	noi_bat BIT DEFAULT 0,
	hinh_anh VARCHAR(255),
	thuong_hieu VARCHAR(100),
	mo_ta VARCHAR(1000),
	cua_hang_co_san VARCHAR(255),
	email VARCHAR(20),
	FOREIGN KEY (ma_nha_cung_cap) REFERENCES Nha_cung_cap(ma_nha_cung_cap),
	FOREIGN KEY (ma_loai) REFERENCES Loai_san_pham(ma_loai),
);

CREATE TABLE Nguoi_quan_li (
	ma_quan_li VARCHAR(20) PRIMARY KEY,
	ten_quan_li VARCHAR(100) NOT NULL,
	dia_chi VARCHAR(255),
	so_dien_thoai VARCHAR(15),
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
	ma_hoa_don INT PRIMARY KEY IDENTITY(1,1),
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

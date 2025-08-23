import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy } from "passport-local";
import session from "express-session";
import env from "dotenv";

const app = express();
const port = 3000;
const saltRounds = 10;
env.config() 

app.use(express.static("views"));
app.use(express.static("public"));

app.set("views", "./views"); 
app.set("view engine", "ejs");

const db = new pg.Client({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT
})

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // Thời gian sống của cookie (24 giờ)
      secure: process.env.NODE_ENV === "production", // Chỉ sử dụng cookie secure trong production với HTTPS
    },
  })
);


app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
db.connect().catch(err => {
  console.error("Lỗi kết nối database:", err);
});

passport.use(
  new Strategy(async function verify(username, password, cb) {
    try {
      const result = await db.query("SELECT * FROM tai_khoan WHERE ten_dang_nhap = $1", [username]);
      if (result.rows.length > 0) {
        const user = result.rows[0];
        const storedHashedPassword = user.mat_khau;
        bcrypt.compare(password, storedHashedPassword, (err, valid) => {
          if (err) {
            console.error("Lỗi hashing:", err);
            return cb(err);
          } else {
            if (valid) {
              return cb(null, user);
            } else {
              return cb(null, false);
            }
          }
        });
      } else {
        return cb(null, false);
      }
    } catch (err) {
      console.error("Lỗi khi xác thực:", err);
      return cb(err);
    }
  })
);

// Serialize and deserialize user
passport.serializeUser((user, cb) => {
  cb(null, user.ma_tai_khoan); // Sử dụng ma_tai_khoan thay vì ten_dang_nhap
});

passport.deserializeUser(async (ma_tai_khoan, cb) => {
  try {
    const result = await db.query("SELECT * FROM tai_khoan WHERE ma_tai_khoan = $1", [ma_tai_khoan]);
    if (result.rows.length > 0) {
      cb(null, result.rows[0]);
    } else {
      cb(null, false);
    }
  } catch (err) {
    cb(err);
  }
});
app.get("/register", (req, res) => {
  res.render("register.ejs");
});
// Thêm vào sau các middleware khác (sau app.use(bodyParser...))
app.use(async (req, res, next) => {
  try {
    if (req.isAuthenticated() && req.user.ma_tai_khoan) {
      const cartResult = await db.query(
        "SELECT SUM(so_luong) as cart_count FROM gio_hang WHERE ma_tai_khoan = $1",
        [req.user.ma_tai_khoan]
      );
      res.locals.cartCount = cartResult.rows[0].cart_count || 0;
    } else {
      res.locals.cartCount = 0;
    }
    next();
  } catch (err) {
    console.error("Lỗi khi đếm giỏ hàng:", err);
    res.locals.cartCount = 0;
    next();
  }
});
app.get("/login", (req, res) => {
  res.render("login.ejs");
});

// Login route
app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/home",
    failureRedirect: "/login",
    failureFlash: false
  })
);


app.post("/register", async (req, res) => {
  const { username, password, confirmPassword, name, address, phone, date, accountType } = req.body;

  // Kiểm tra mật khẩu khớp
  if (password !== confirmPassword) {
    return res.send("<script>alert('Mật khẩu không khớp!'); window.history.back();</script>");
  }

  // Kiểm tra định dạng số điện thoại
  const phoneRegex = /^[0-9]{10}$/;
  if (!phoneRegex.test(phone)) {
    return res.send("<script>alert('Số điện thoại phải có 10 chữ số!'); window.history.back();</script>");
  }

  // Kiểm tra ngày hợp lệ
  let validDate;
  try {
    validDate = new Date(date);
    if (isNaN(validDate.getTime())) throw new Error("Invalid date");
  } catch (error) {
    return res.send("<script>alert('Ngày không hợp lệ!'); window.history.back();</script>");
  }

  try {
    // Kiểm tra tên đăng nhập đã tồn tại
    const checkResult = await db.query("SELECT * FROM tai_khoan WHERE ten_dang_nhap = $1", [username]);
    if (checkResult.rows.length > 0) {
      return res.send("<script>alert('Tên đăng nhập đã tồn tại!'); window.history.back();</script>");
    }

    // Tạo mã tài khoản và mã ID ngẫu nhiên
    let ma_tai_khoan, ma_id, loai_tai_khoan;
    if (accountType === "Customer") {
      ma_tai_khoan = "KH" + generateRandomNumbers(3);
      loai_tai_khoan = "KH";
    } else if (accountType === "Staff") {
      ma_tai_khoan = "NV" + generateRandomNumbers(3);
      loai_tai_khoan = "NV";
    } else if (accountType === "Manager") {
      ma_tai_khoan = "QL" + generateRandomNumbers(3);
      loai_tai_khoan = "QL";
    } else {
      return res.send("<script>alert('Loại tài khoản không hợp lệ!'); window.history.back();</script>");
    }

    // Kiểm tra mã tài khoản duy nhất
    let isTaiKhoanUnique = false;
    while (!isTaiKhoanUnique) {
      const codeCheck = await db.query("SELECT * FROM tai_khoan WHERE ma_tai_khoan = $1", [ma_tai_khoan]);
      if (codeCheck.rows.length === 0) {
        isTaiKhoanUnique = true;
      } else {
        ma_tai_khoan = (accountType === "Customer" ? "KH" : accountType === "Staff" ? "NV" : "QL") + generateRandomNumbers(3);
      }
    }

    // Tạo mã ID ngẫu nhiên (6 chữ số) cho ma_khach_hang, ma_nhan_vien, ma_quan_li
    ma_id = generateRandomNumbers(6);

    // Kiểm tra mã ID duy nhất
    let isIdUnique = false;
    while (!isIdUnique) {
      let idCheck;
      if (accountType === "Customer") {
        idCheck = await db.query("SELECT * FROM khach_hang WHERE ma_khach_hang = $1", [ma_id]);
      } else if (accountType === "Staff") {
        idCheck = await db.query("SELECT * FROM nhan_vien WHERE ma_nhan_vien = $1", [ma_id]);
      } else if (accountType === "Manager") {
        idCheck = await db.query("SELECT * FROM nguoi_quan_ly WHERE ma_quan_li = $1", [ma_id]);
      }
      if (idCheck.rows.length === 0) {
        isIdUnique = true;
      } else {
        ma_id = generateRandomNumbers(6);
      }
    }

    // Mã hóa mật khẩu
    const hash = await bcrypt.hash(password, saltRounds);

    // Thêm vào bảng tai_khoan
    const taiKhoanResult = await db.query(
      "INSERT INTO tai_khoan (ma_tai_khoan, ten_dang_nhap, mat_khau, loai_tai_khoan) VALUES ($1, $2, $3, $4) RETURNING *",
      [ma_tai_khoan, username, hash, loai_tai_khoan]
    );
    const newUser = taiKhoanResult.rows[0];

    // Thêm vào bảng tương ứng dựa trên loại tài khoản
    if (accountType === "Customer") {
      await db.query(
        "INSERT INTO khach_hang (ma_khach_hang, ten_khach_hang, dia_chi, so_dien_thoai, ngay_dang_ki, ma_tai_khoan) VALUES ($1, $2, $3, $4, $5, $6)",
        [ma_id, name, address, phone, validDate, ma_tai_khoan]
      );
    } else if (accountType === "Staff") {
      await db.query(
        "INSERT INTO nhan_vien (ma_nhan_vien, ten_nhan_vien,dia_chi, so_dien_thoai, ngay_vao_lam, ma_tai_khoan) VALUES ($1, $2, $3, $4, $5, $6)",
        [ma_id, name,address,phone, validDate, ma_tai_khoan]
      );
    } else if (accountType === "Manager") {
      await db.query(
        "INSERT INTO nguoi_quan_ly (ma_quan_li, ten_quan_li, dia_chi, so_dien_thoai, ma_tai_khoan) VALUES ($1, $2, $3, $4, $5)",
        [ma_id, name, address, phone, ma_tai_khoan]
      );
      // Thêm vào nhan_vien (giả sử quản lý cũng là nhân viên)
      await db.query(
        "INSERT INTO nhan_vien (ma_nhan_vien, ten_nhan_vien, ngay_vao_lam, ma_tai_khoan) VALUES ($1, $2, $3, $4)",
        [ma_id, name, validDate, ma_tai_khoan]
      );
    }

    // Đăng nhập tự động
    req.login(newUser, (err) => {
      if (err) {
        console.error("Lỗi đăng nhập sau khi đăng ký:", err);
        return res.send("<script>alert('Đăng ký thành công nhưng lỗi đăng nhập. Vui lòng đăng nhập lại!'); window.location.href = '/login';</script>");
      }
      res.send("<script>alert('Đăng ký thành công!'); window.location.href = '/home';</script>");
    });
  } catch (err) {
    console.error("Lỗi đăng ký:", err);
    res.send("<script>alert('Lỗi đăng ký: " + err.message + "'); window.history.back();</script>");
  }
});
// Hàm tạo chuỗi số ngẫu nhiên với độ dài xác định
function generateRandomNumbers(length) {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += Math.floor(Math.random() * 10); // Số từ 0-9
  }
  return result;
}

app.get("/", (req, res) => {
  res.render("login.ejs");
});

app.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error("Lỗi khi đăng xuất:", err);
      return res.redirect("/login");
    }
    req.session.destroy((err) => {
      if (err) {
        console.error("Lỗi khi xóa session:", err);
        return res.redirect("/login");
      }
      res.redirect("/login");
    });
  });
});

app.post("/registerForm", async (req, res) => {
  res.render("register.ejs");
});

app.get("/contact", (req, res) => {
  res.render("contact.ejs");
});

app.get("/home", async (req, res) => {
  try {
    // Lấy sản phẩm điện thoại (Ma_loai = 1)
    const phoneResult = await db.query("SELECT * FROM san_pham WHERE ma_loai = 1 ORDER BY ma_san_pham LIMIT 5");

    // Lấy sản phẩm laptop (Ma_loai = 2)
    const laptopResult = await db.query("SELECT * FROM san_pham WHERE ma_loai = 2 ORDER BY ma_san_pham LIMIT 5");

    // Lấy thiết bị thông minh (Ma_loai = 5)
    const smartDeviceResult = await db.query("SELECT * FROM san_pham WHERE ma_loai = 3 ORDER BY ma_san_pham LIMIT 5");

    // Lấy sản phẩm nổi bật
    const featuredResult = await db.query("SELECT * FROM san_pham WHERE noi_bat = 1 ORDER BY Gia DESC LIMIT 5");

    res.render("index.ejs", {
      phones: phoneResult.rows,     
      laptops: laptopResult.rows,    
      watches: smartDeviceResult.rows,     
      featured: featuredResult.rows 
    });
  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu:", error);
    res.status(500).send("Đã xảy ra lỗi khi lấy dữ liệu: " + error.message);
  }
});

app.get("/manage-items", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM san_pham ORDER BY ma_san_pham");
    res.render("manage_items.ejs", { products: result.rows });
  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu:", error);
    res.status(500).send("Đã xảy ra lỗi khi lấy dữ liệu: " + error.message);
  }
}
);
app.get("/edit-product-form/:ma_san_pham", async (req, res) => {
  if (!req.isAuthenticated() || !["NV", "QL"].includes(req.user.loai_tai_khoan)) {
    return res.send("<script>alert('Bạn không có quyền chỉnh sửa sản phẩm!'); window.location.href = '/manage-items';</script>");
  }
  const ma_san_pham = req.params.ma_san_pham;
  console.log("Product ID:", ma_san_pham);
  try {
    // Truy vấn thông tin sản phẩm theo mã sản phẩm
    const result = await db.query("SELECT * FROM san_pham WHERE ma_san_pham = $1", [ma_san_pham]);
    if (result.rows.length === 0) {
      return res.status(404).send("Không tìm thấy sản phẩm");
    }
    const product = result.rows[0];
    // Render trang chỉnh sửa sản phẩm với thông tin sản phẩm
    res.render("edit_product.ejs", { product: product });
  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu:", error);
    res.status(500).send("Đã xảy ra lỗi khi lấy dữ liệu: " + error.message);
  }
}); 
app.post("/edit-product/:ma_san_pham", async (req, res) => {
  if (!req.isAuthenticated() || !["NV", "QL"].includes(req.user.loai_tai_khoan)) {
    return res.send("<script>alert('Bạn không có quyền chỉnh sửa sản phẩm!'); window.location.href = '/manage-items';</script>");
  }

  const { ma_san_pham } = req.params;
  const { ten_san_pham, gia, so_luong, tinh_nang_noi_bat, cua_hang_co_san } = req.body;

  try {
    // Kiểm tra sản phẩm có tồn tại
    const productCheck = await db.query("SELECT * FROM san_pham WHERE ma_san_pham = $1", [ma_san_pham]);
    if (productCheck.rows.length === 0) {
      return res.send("<script>alert('Sản phẩm không tồn tại!'); window.location.href = '/manage-items';</script>");
    }

    // Kiểm tra dữ liệu đầu vào
    if (!ten_san_pham || !gia || !so_luong) {
      return res.send("<script>alert('Vui lòng điền đầy đủ các trường bắt buộc!'); window.history.back();</script>");
    }

    const parsedGia = parseFloat(gia);
    const parsedSoLuong = parseInt(so_luong);

    if (isNaN(parsedGia) || parsedGia < 0) {
      return res.send("<script>alert('Giá phải là số dương!'); window.history.back();</script>");
    }

    if (isNaN(parsedSoLuong) || parsedSoLuong < 0) {
      return res.send("<script>alert('Số lượng phải là số không âm!'); window.history.back();</script>");
    }

    // Cập nhật thông tin sản phẩm
    await db.query(
      "UPDATE san_pham SET ten_san_pham = $1, gia = $2, so_luong = $3, tinh_nang_noi_bat = $4, cua_hang_co_san = $5 WHERE ma_san_pham = $6",
      [ten_san_pham, parsedGia, parsedSoLuong, tinh_nang_noi_bat || null, cua_hang_co_san || null, ma_san_pham]
    );

    // Chuyển hướng với thông báo thành công
    res.send("<script>alert('Chỉnh sửa sản phẩm thành công!'); window.location.href = '/manage-items';</script>");
  } catch (err) {
    console.error("Lỗi khi chỉnh sửa sản phẩm:", err);
    res.send("<script>alert('Lỗi khi chỉnh sửa sản phẩm: " + err.message + "'); window.history.back();</script>");
  }
});

app.post("/add-product-quantity/:ma_san_pham", async (req, res) => {
  if (!req.isAuthenticated() || !["NV", "QL"].includes(req.user.loai_tai_khoan)) {
    return res.status(403).json({
      success: false,
      message: "Bạn không có quyền thêm số lượng sản phẩm!"
    });
  }

  const { ma_san_pham } = req.params;
  const { quantity } = req.body;
  console.log("Quantity:", quantity);
  try {
    // Kiểm tra sản phẩm có tồn tại
    const productCheck = await db.query("SELECT so_luong FROM san_pham WHERE ma_san_pham = $1", [ma_san_pham]);
    if (productCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Sản phẩm không tồn tại!"
      });
    }

    // Kiểm tra số lượng hợp lệ
    const parsedQuantity = parseInt(quantity);
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Số lượng phải là số nguyên dương!"
      });
    }

    // Cập nhật số lượng
    await db.query(
      "UPDATE san_pham SET so_luong = so_luong + $1 WHERE ma_san_pham = $2",
      [parsedQuantity, ma_san_pham]
    );

    // Trả về phản hồi thành công
    res.status(200).json({
      success: true,
      message: "Thêm số lượng sản phẩm thành công!"
    });
  } catch (err) {
    console.error("Lỗi khi thêm số lượng sản phẩm:", err);
    res.status(500).json({
      success: false,
      message: "Lỗi khi thêm số lượng sản phẩm: " + err.message
    });
  }
});
app.get("/profile", async (req, res) => {
  try {
    const maTaiKhoan = req.user.ma_tai_khoan;
    let userInfo;

    if (maTaiKhoan.startsWith('KH')) {
      // Truy vấn thông tin khách hàng
      const result = await db.query(`
        SELECT 
            tk.ma_tai_khoan, 
            tk.ten_dang_nhap,
            tk.loai_tai_khoan,
            kh.ma_khach_hang,
            kh.ten_khach_hang,
            kh.dia_chi,
            kh.so_dien_thoai,
            kh.ngay_dang_ki
        FROM 
            tai_khoan tk
        JOIN 
            khach_hang kh ON tk.ma_tai_khoan = kh.ma_tai_khoan
        WHERE 
            tk.ma_tai_khoan = $1
      `, [maTaiKhoan]);

      if (result.rows.length > 0) {
        userInfo = result.rows[0];
        userInfo.vai_tro = "Khách hàng";
      }
    } else if (maTaiKhoan.startsWith('NV')) {
      // Truy vấn thông tin nhân viên
      const result = await db.query(`
        SELECT 
            tk.ma_tai_khoan, 
            tk.ten_dang_nhap,
            tk.loai_tai_khoan,
            nv.ma_nhan_vien,
            nv.ten_nhan_vien,
            nv.ngay_vao_lam
        FROM 
            tai_khoan tk
        JOIN 
            nhan_vien nv ON tk.ma_tai_khoan = nv.ma_tai_khoan
        WHERE 
            tk.ma_tai_khoan = $1
      `, [maTaiKhoan]);

      if (result.rows.length > 0) {
        userInfo = result.rows[0];
        userInfo.vai_tro = "Nhân viên";
      }
    } else if (maTaiKhoan.startsWith('QL')) {
      // Truy vấn thông tin quản lý
      const result = await db.query(`
        SELECT 
            tk.ma_tai_khoan, 
            tk.ten_dang_nhap,
            tk.loai_tai_khoan,
            ql.ma_quan_li,
            ql.ten_quan_li,
            ql.dia_chi,
            ql.so_dien_thoai
        FROM 
            tai_khoan tk
        JOIN 
            nguoi_quan_ly ql ON tk.ma_tai_khoan = ql.ma_tai_khoan
        WHERE 
            tk.ma_tai_khoan = $1
      `, [maTaiKhoan]);

      if (result.rows.length > 0) {
        userInfo = result.rows[0];
        userInfo.vai_tro = "Quản lý";
      }
    }

    if (!userInfo) {
      return res.status(404).send("Không tìm thấy thông tin người dùng");
    }

    // Render trang profile với thông tin người dùng
    res.render("profile.ejs", { user: userInfo });
  } catch (err) {
    console.error("Lỗi khi truy vấn thông tin profile:", err);
    res.status(500).send("Đã xảy ra lỗi khi tải thông tin người dùng. Vui lòng thử lại sau.");
  }
});


app.get("/delete-product/:ma_san_pham", async (req, res) => {
  if (!req.isAuthenticated() || !["QL"].includes(req.user.loai_tai_khoan)) {
    return res.send("<script>alert('Bạn không có quyền chỉnh sửa số lượng sản phẩm!'); window.location.href = '/manage-items';</script>");
  }

  const { ma_san_pham } = req.params;
  try {
    // Kiểm tra sản phẩm có tồn tại không
    const productCheck = await db.query("SELECT so_luong FROM san_pham WHERE ma_san_pham = $1", [ma_san_pham]);
    if (productCheck.rows.length === 0) {
      return res.send("<script>alert('Sản phẩm không tồn tại!'); window.location.href = '/manage-items';</script>");
    }

    const currentQuantity = productCheck.rows[0].so_luong;

    // Kiểm tra số lượng
    if (currentQuantity <= 0) {
      return res.send("<script>alert('Sản phẩm đã hết hàng, không thể giảm thêm!'); window.location.href = '/manage-items';</script>");
    }

    // Giảm số lượng đi 1
    await db.query("UPDATE san_pham SET so_luong = so_luong - 1 WHERE ma_san_pham = $1", [ma_san_pham]);

    // Chuyển hướng với thông báo thành công
    res.send("<script>alert('Giảm số lượng sản phẩm thành công!'); window.location.href = '/manage-items';</script>");
  } catch (err) {
    console.error("Lỗi khi giảm số lượng sản phẩm:", err);
    res.send("<script>alert('Lỗi khi giảm số lượng sản phẩm: " + err.message + "'); window.location.href = '/manage-items';</script>");
  }
});
app.get("/menu_categories_dienThoai", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM san_pham sp JOIN loai_san_pham lsp ON sp.ma_loai = lsp.ma_loai WHERE sp.ma_loai = 1 ORDER BY ma_san_pham");
    res.render("detailMenu.ejs", { 
      products: result.rows,
      categories: result.rows[0] // Lấy tên loại sản phẩm từ kết quả truy vấn
    });
  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu:", error);
    res.status(500).send("Đã xảy ra lỗi khi lấy dữ liệu: " + error.message);
  }
}
);

app.get("/menu_categories_laptop", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM san_pham sp JOIN loai_san_pham lsp ON sp.ma_loai = lsp.ma_loai WHERE sp.ma_loai = 2 ORDER BY ma_san_pham");
    res.render("detailMenu.ejs", { 
      products: result.rows,
      categories: result.rows[0] // Lấy tên loại sản phẩm từ kết quả truy vấn
    });
  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu:", error);
    res.status(500).send("Đã xảy ra lỗi khi lấy dữ liệu: " + error.message);
  }
}
);

app.get("/menu_categories_thietBiThongMinh", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM san_pham sp JOIN loai_san_pham lsp ON sp.ma_loai = lsp.ma_loai WHERE sp.ma_loai = 3 ORDER BY ma_san_pham");
    res.render("detailMenu.ejs", { 
      products: result.rows,
      categories: result.rows[0] // Lấy tên loại sản phẩm từ kết quả truy vấn
    });
  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu:", error);
    res.status(500).send("Đã xảy ra lỗi khi lấy dữ liệu: " + error.message);
  }
}
);

app.get("/menu_categories_mayTinhBang", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM san_pham sp JOIN loai_san_pham lsp ON sp.ma_loai = lsp.ma_loai WHERE sp.ma_loai = 4 ORDER BY ma_san_pham");
    res.render("detailMenu.ejs", { 
      products: result.rows,
      categories: result.rows[0] // Lấy tên loại sản phẩm từ kết quả truy vấn
    });
  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu:", error);
    res.status(500).send("Đã xảy ra lỗi khi lấy dữ liệu: " + error.message);
  }
}
);

app.get("/menu_categories_phuKien", async (req, res) => {
  try { 
    const result = await db.query("SELECT * FROM san_pham sp JOIN loai_san_pham lsp ON sp.ma_loai = lsp.ma_loai WHERE sp.ma_loai = 5 ORDER BY ma_san_pham");
    res.render("detailMenu.ejs", { 
      products: result.rows,
      categories: result.rows[0] // Lấy tên loại sản phẩm từ kết quả truy vấn
    });
  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu:", error);
    res.status(500).send("Đã xảy ra lỗi khi lấy dữ liệu: " + error.message);
  }
}
)
app.get('/search', async (req, res) => {
  try {
    const searchTerm = req.query.q;
    
    if (!searchTerm) {
      // Nếu không có từ khóa tìm kiếm, hiển thị trang tìm kiếm trống
      return res.render('search_results', { products: [], searchTerm: '' });
    }
    
    // Sử dụng ILIKE để tìm kiếm không phân biệt chữ hoa/thường
    const query = `
      SELECT * FROM San_pham 
      WHERE Ten_san_pham ILIKE $1
      ORDER BY Ten_san_pham ASC
    `;
    
    const result = await db.query(query, [`%${searchTerm}%`]);
    
    // Render trang kết quả tìm kiếm với dữ liệu tìm được
    res.render('search_results', { 
      products: result.rows,
      searchTerm: searchTerm
    });
    
  } catch (error) {
    console.error('Lỗi khi tìm kiếm sản phẩm:', error);
    res.status(500).send('Đã xảy ra lỗi khi tìm kiếm sản phẩm. Vui lòng thử lại sau.');
  }
});

// Endpoint POST xử lý form tìm kiếm
app.post('/search', (req, res) => {
  const searchTerm = req.body.q;
  // Chuyển hướng đến route GET với query parameter
  res.redirect(`/search?q=${encodeURIComponent(searchTerm)}`);
});

// Route để hiển thị chi tiết sản phẩm điện thoại theo ID
app.post("/product_detail_phone", async(req, res) => {
  try {
    // Lấy ID sản phẩm từ body của request
    const productId = req.body.ma_san_pham;
    console.log("Product ID:", productId);
    if (!productId) {
      return res.status(400).send("Thiếu mã sản phẩm");
    }
    
    // Truy vấn thông tin sản phẩm
    const productResult = await db.query("SELECT * FROM san_pham WHERE ma_san_pham = $1", [productId]);
  
    if (productResult.rows.length === 0) {
      return res.status(404).send("Không tìm thấy sản phẩm");
    }
    
    const product = productResult.rows[0];
    
    // Lấy thông tin loại sản phẩm
    const categoryResult = await db.query("SELECT * FROM loai_san_pham WHERE ma_loai = $1", [product.ma_loai]);
    const category = categoryResult.rows[0];
    
    // Lấy sản phẩm liên quan cùng loại
    const relatedProducts = await db.query(
      "SELECT * FROM San_pham WHERE ma_loai = $1 AND ma_san_pham != $2 LIMIT 4",
      [product.ma_loai, productId]
    );
    
    // Lấy tất cả các đánh giá của sản phẩm
    const evaluations = await db.query("SELECT * FROM thong_tin_danh_gia WHERE ma_san_pham = $1", [productId]);
    const evaluationResult = evaluations.rows;
    
    // Lấy thông tin chi tiết cho mỗi đánh giá
    const evaluationResultDetails = [];
    
    for (const item of evaluationResult) {
      const userInfo = {
        ...item,
        // Thêm bất kỳ thông tin bổ sung nào cần thiết cho mỗi đánh giá
      };
      evaluationResultDetails.push(userInfo);
    }
    
    res.render("detail_product.ejs", {
      product: product,
      category: category,
      related: relatedProducts.rows,
      evaluations: evaluationResultDetails // Sử dụng evaluationResultDetails thay vì evaluations
    });
    
  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu:", error);
    res.status(500).send("Đã xảy ra lỗi khi lấy dữ liệu: " + error.message);
  }
});

app.get("/product_detail_phone", async(req, res) => {
  try {
    // Lấy ID sản phẩm từ query của request (thay đổi từ body sang query)
    const productId = req.query.ma_san_pham;
    if (!productId) {
      return res.status(400).send("Thiếu mã sản phẩm");
    }
    
    // Truy vấn thông tin sản phẩm
    const productResult = await db.query("SELECT * FROM san_pham WHERE ma_san_pham = $1", [productId]);
  
    if (productResult.rows.length === 0) {
      return res.status(404).send("Không tìm thấy sản phẩm");
    }
    
    const product = productResult.rows[0];
    
    // Lấy thông tin loại sản phẩm
    const categoryResult = await db.query("SELECT * FROM loai_san_pham WHERE ma_loai = $1", [product.ma_loai]);
    const category = categoryResult.rows[0];
    
    // Lấy sản phẩm liên quan cùng loại
    const relatedProducts = await db.query(
      "SELECT * FROM San_pham WHERE ma_loai = $1 AND ma_san_pham != $2 LIMIT 4",
      [product.ma_loai, productId]
    );
    
    // Lấy tất cả các đánh giá của sản phẩm
    const evaluations = await db.query("SELECT * FROM thong_tin_danh_gia WHERE ma_san_pham = $1", [productId]);
    const evaluationResult = evaluations.rows;
    
    // Lấy thông tin chi tiết cho mỗi đánh giá
    const evaluationResultDetails = [];
    
    for (const item of evaluationResult) {
      const userInfo = {
        ...item,
        // Thêm bất kỳ thông tin bổ sung nào cần thiết cho mỗi đánh giá
      };
      evaluationResultDetails.push(userInfo);
    }
    
    res.render("detail_product.ejs", {
      product: product,
      category: category,
      related: relatedProducts.rows,
      evaluations: evaluationResultDetails // Sử dụng evaluationResultDetails thay vì evaluations
    });
    
  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu:", error);
    res.status(500).send("Đã xảy ra lỗi khi lấy dữ liệu: " + error.message);
  }
});

app.post("/product_detail_laptop", async(req, res) => {
  try {
    const productId = req.body.ma_san_pham; 
    console.log("Product ID:", productId);
    // Truy vấn thông tin sản phẩm
    const productResult = await db.query("SELECT * FROM san_pham WHERE ma_san_pham = $1", [productId]);

    if (productResult.rows.length === 0) {
      return res.status(404).send("Không tìm thấy sản phẩm");
    }
    
    const product = productResult.rows[0];
    
    // Lấy thông tin loại sản phẩm
    const categoryResult = await db.query("SELECT * FROM loai_san_pham WHERE ma_loai = $1", [product.ma_loai]);
    const category = categoryResult.rows[0];

    
    // Lấy sản phẩm liên quan cùng loại
    const relatedProducts = await db.query(
      "SELECT * FROM san_pham WHERE ma_loai = $1 AND ma_san_pham != $2 LIMIT 4",
      [product.ma_loai, productId]
    );
    const evaluations = await db.query("SELECT * FROM thong_tin_danh_gia WHERE ma_san_pham = $1", [productId]);
    const evaluationResult = evaluations.rows;
    
    // Lấy thông tin chi tiết cho mỗi đánh giá
    const evaluationResultDetails = [];
    
    for (const item of evaluationResult) {
      const userInfo = {
        ...item,
        // Thêm bất kỳ thông tin bổ sung nào cần thiết cho mỗi đánh giá
      };
      evaluationResultDetails.push(userInfo);
    }
    // Render trang chi tiết sản phẩm
    res.render("detail_product.ejs", {  // Thêm .ejs để rõ ràng 
      product: product,
      category: category,
      related: relatedProducts.rows,
      evaluations: evaluationResultDetails
    });
    
  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu:", error);
    res.status(500).send("Đã xảy ra lỗi khi lấy dữ liệu: " + error.message);
  }
});


app.post("/product_detail_apple_watch", async(req, res) => {
  try {
    // Lấy ID sản phẩm từ body của request - sửa lại tên input
    const productId = req.body.ma_san_pham;  // Đã sửa từ product_id thành ma_san_pham
    
    // Truy vấn thông tin sản phẩm
    const productResult = await db.query("SELECT * FROM san_pham WHERE ma_san_pham = $1", [productId]);
  
    if (productResult.rows.length === 0) {
      return res.status(404).send("Không tìm thấy sản phẩm");
    }
    
    const product = productResult.rows[0];
    
    // Lấy thông tin loại sản phẩm
    const categoryResult = await db.query("SELECT * FROM loai_san_pham WHERE ma_loai = $1", [product.ma_loai]);
    const category = categoryResult.rows[0];
    
    // Lấy sản phẩm liên quan cùng loại
    const relatedProducts = await db.query(
      "SELECT * FROM San_pham WHERE ma_loai = $1 AND ma_san_pham != $2 LIMIT 4",
      [product.ma_loai, productId]
    );
    const evaluations = await db.query("SELECT * FROM thong_tin_danh_gia WHERE ma_san_pham = $1", [productId]);
    const evaluationResult = evaluations.rows;
    
    // Lấy thông tin chi tiết cho mỗi đánh giá
    const evaluationResultDetails = [];
    
    for (const item of evaluationResult) {
      const userInfo = {
        ...item,
        // Thêm bất kỳ thông tin bổ sung nào cần thiết cho mỗi đánh giá
      };
      evaluationResultDetails.push(userInfo);
    }
    // Render trang chi tiết sản phẩm
    res.render("detail_product.ejs", {  
      product: product,
      category: category,
      related: relatedProducts.rows,
      evaluations: evaluationResultDetails
    });
    
  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu:", error);
    res.status(500).send("Đã xảy ra lỗi khi lấy dữ liệu: " + error.message);
  }
});

app.post("/product_detail_related_item", async(req, res) => {
  try {
    // Lấy ID sản phẩm từ body của request - sửa lại tên input
    const productId = req.body.product_id;  // Đã sửa từ product_id thành ma_san_pham
    // Truy vấn thông tin sản phẩm
    const productResult = await db.query("SELECT * FROM San_pham WHERE Ma_san_pham = $1", [productId]);
  
    if (productResult.rows.length === 0) {
      return res.status(404).send("Không tìm thấy sản phẩm");
    }
    
    const product = productResult.rows[0];
    
    // Lấy thông tin loại sản phẩm
    const categoryResult = await db.query("SELECT * FROM Loai_san_pham WHERE Ma_loai = $1", [product.Ma_loai]);
    const category = categoryResult.rows[0];
    
    // Lấy sản phẩm liên quan cùng loại
    const relatedProducts = await db.query(
      "SELECT * FROM San_pham WHERE Ma_loai = $1 AND Ma_san_pham != $2 LIMIT 4",
      [product.Ma_loai, productId]
    );
    const evaluations = await db.query("SELECT * FROM thong_tin_danh_gia WHERE ma_san_pham = $1", [productId]);
    const evaluationResult = evaluations.rows;
    
    // Lấy thông tin chi tiết cho mỗi đánh giá
    const evaluationResultDetails = [];
    
    for (const item of evaluationResult) {
      const userInfo = {
        ...item,
        // Thêm bất kỳ thông tin bổ sung nào cần thiết cho mỗi đánh giá
      };
      evaluationResultDetails.push(userInfo);
    }
    // Render trang chi tiết sản phẩm
    res.render("detail_product.ejs", {  
      product: product,
      category: category,
      related: relatedProducts.rows,
      evaluations: evaluationResultDetails
    });
    
  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu:", error);
    res.status(500).send("Đã xảy ra lỗi khi lấy dữ liệu: " + error.message);
  }
});



app.post("/add_to_shopping_cart", async (req, res) => {
  try {
    const product_id = req.body.product_id;
    const user = req.user;

    if (!req.isAuthenticated() || !user.ma_tai_khoan) {
      console.log("User not authenticated or ma_tai_khoan missing:", user);
      return res.status(401).send("<script>alert('Vui lòng đăng nhập để thêm vào giỏ hàng!'); window.location.href = '/login';</script>");
    }

    const temp = await db.query("SELECT * FROM san_pham WHERE ma_san_pham = $1", [product_id]);
    const product = temp.rows[0];

    if (!product) {
      return res.status(404).send("<script>alert('Sản phẩm không tồn tại!'); window.history.back();</script>");
    }

    if (product.so_luong <= 0) {
      return res.status(400).send("<script>alert('Sản phẩm đã hết hàng!'); window.history.back();</script>");
    }

    // Kiểm tra sản phẩm đã tồn tại trong giỏ hàng chưa
    const existingItem = await db.query(
      "SELECT so_luong FROM gio_hang WHERE ma_tai_khoan = $1 AND ma_san_pham = $2",
      [user.ma_tai_khoan, product_id]
    );
    const existingQuantity = existingItem.rows[0]?.so_luong || 0;

    if (existingQuantity > 0) {
      await db.query(
        "UPDATE gio_hang SET so_luong = so_luong + 1 WHERE ma_tai_khoan = $1 AND ma_san_pham = $2",
        [user.ma_tai_khoan, product_id]
      );
    } else {
      await db.query(
        "INSERT INTO gio_hang (ma_tai_khoan, ma_san_pham, so_luong) VALUES ($1, $2, $3)",
        [user.ma_tai_khoan, product_id, 1]
      );
    }

    res.send(`<script>alert('Đã thêm vào giỏ hàng thành công!'); window.location.href = '/product_detail_phone?ma_san_pham=${product_id}';</script>`);
  } catch (error) {
    console.error("Lỗi khi thêm vào giỏ hàng:", error);
    res.status(500).send("Đã xảy ra lỗi khi thêm vào giỏ hàng: " + error.message);
  }
});
app.get("/payment", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.send("<script>alert('Vui lòng đăng nhập để thanh toán!'); window.location.href = '/login';</script>");
    }

    const maTaiKhoan = req.user.ma_tai_khoan;
    let userInfo;

    if (maTaiKhoan.startsWith("KH")) {
      const result = await db.query(
        `SELECT tk.ma_tai_khoan, tk.ten_dang_nhap, tk.loai_tai_khoan, kh.ma_khach_hang, kh.ten_khach_hang, kh.dia_chi, kh.so_dien_thoai, kh.ngay_dang_ki
         FROM tai_khoan tk JOIN khach_hang kh ON tk.ma_tai_khoan = kh.ma_tai_khoan
         WHERE tk.ma_tai_khoan = $1`,
        [maTaiKhoan]
      );
      if (result.rows.length > 0) {
        userInfo = result.rows[0];
        userInfo.vai_tro = "Khách hàng";
      }
    } else if (maTaiKhoan.startsWith("QL")) {
      const result = await db.query(
        `SELECT tk.ma_tai_khoan, tk.ten_dang_nhap, tk.loai_tai_khoan, ql.ma_quan_li, ql.ten_quan_li, ql.dia_chi, ql.so_dien_thoai
         FROM tai_khoan tk JOIN nguoi_quan_ly ql ON tk.ma_tai_khoan = ql.ma_tai_khoan
         WHERE tk.ma_tai_khoan = $1`,
        [maTaiKhoan]
      );
      if (result.rows.length > 0) {
        userInfo = result.rows[0];
        userInfo.vai_tro = "Quản lý";
      }
    } else if (maTaiKhoan.startsWith("NV")) {
      const result = await db.query(
        `SELECT tk.ma_tai_khoan, tk.ten_dang_nhap, tk.loai_tai_khoan, nv.ma_nhan_vien, nv.ten_nhan_vien, nv.ngay_vao_lam
         FROM tai_khoan tk JOIN nhan_vien nv ON tk.ma_tai_khoan = nv.ma_tai_khoan
         WHERE tk.ma_tai_khoan = $1`,
        [maTaiKhoan]
      );
      if (result.rows.length > 0) {
        userInfo = result.rows[0];
        userInfo.vai_tro = "Nhân viên";
      }
    }

    if (!userInfo) {
      return res.status(404).send("Không tìm thấy thông tin người dùng");
    }

    const cartItemsResult = await db.query(
      "SELECT gh.ma_san_pham, gh.so_luong, sp.hinh_anh, sp.ten_san_pham, sp.gia " +
      "FROM gio_hang gh JOIN san_pham sp ON gh.ma_san_pham = sp.ma_san_pham " +
      "WHERE gh.ma_tai_khoan = $1",
      [maTaiKhoan]
    );
    const cartItems = cartItemsResult.rows;

    if (!cartItems || cartItems.length === 0) {
      return res.send("<script>alert('Giỏ hàng của bạn đang trống!'); window.location.href = '/shopping_cart';</script>");
    }

    const totalQuantity = cartItems.reduce((sum, item) => sum + item.so_luong, 0);
    const totalPrice = cartItems.reduce((sum, item) => sum + (item.gia * item.so_luong), 0);

    let maKhachHang, tenNguoiMua, diaChi, soDienThoai;
    if (userInfo.vai_tro === "Khách hàng") {
      maKhachHang = userInfo.ma_khach_hang;
      tenNguoiMua = userInfo.ten_khach_hang;
      diaChi = userInfo.dia_chi || "N/A";
      soDienThoai = userInfo.so_dien_thoai || "N/A";
    } else if (userInfo.vai_tro === "Quản lý") {
      maKhachHang = userInfo.ma_quan_li;
      tenNguoiMua = userInfo.ten_quan_li;
      diaChi = userInfo.dia_chi || "N/A";
      soDienThoai = userInfo.so_dien_thoai || "N/A";
    } else if (userInfo.vai_tro === "Nhân viên") {
      maKhachHang = null;
      tenNguoiMua = userInfo.ten_nhan_vien;
      diaChi = "N/A";
      soDienThoai = "N/A";
    }

    const staffResult = await db.query("SELECT ma_nhan_vien FROM nhan_vien LIMIT 1");
    const maNhanVien = staffResult.rows[0]?.ma_nhan_vien || null;

    if (!maNhanVien) {
      return res.status(500).send("Không tìm thấy nhân viên để xử lý hóa đơn!");
    }

    const ma_hoa_don = generateRandomNumbers(4);
    const invoiceResult = await db.query(
      "INSERT INTO hoa_don (ma_khach_hang, ma_nhan_vien, ngay_lap, tong_tien, ma_hoa_don) VALUES ($1, $2, CURRENT_DATE, $3, $4) RETURNING ma_hoa_don",
      [maKhachHang, maNhanVien, totalPrice, ma_hoa_don]
    );

    const maHoaDon = invoiceResult.rows[0].ma_hoa_don;

    for (const item of cartItems) {
      await db.query(
        "INSERT INTO chi_tiet_hoa_don (ma_hoa_don, ma_san_pham, so_luong, don_gia) VALUES ($1, $2, $3, $4)",
        [maHoaDon, item.ma_san_pham, item.so_luong, item.gia]
      );
      await db.query(
        "UPDATE san_pham SET so_luong = so_luong - $1 WHERE ma_san_pham = $2",
        [item.so_luong, item.ma_san_pham]
      );
    }

    await db.query("DELETE FROM gio_hang WHERE ma_tai_khoan = $1", [maTaiKhoan]);

    res.send(`
      <script>
        alert('Thanh toán thành công! Hóa đơn đã được tạo.\\nThông tin hóa đơn:\\n- Tên người mua: ${tenNguoiMua}\\n- Địa chỉ: ${diaChi}\\n- Số điện thoại: ${soDienThoai}\\n- Tổng số lượng: ${totalQuantity}\\n- Tổng tiền: ${totalPrice.toLocaleString('vi-VN')} ₫');
        window.location.href = '/home';
      </script>
    `);
  } catch (err) {
    console.error("Lỗi khi xử lý thanh toán:", err);
    res.status(500).send("Đã xảy ra lỗi khi xử lý thanh toán: " + err.message);
  }
});

app.post("/shopping_cart", async (req, res) => {
  try {
    const user = req.user;
    if (!req.isAuthenticated() || !user.ma_tai_khoan) {
      console.log("User not authenticated or ma_tai_khoan missing:", user);
      return res.redirect("/login");
    }

    const cartItemsResult = await db.query(
      "SELECT gh.ma_san_pham, gh.so_luong, sp.hinh_anh, sp.ten_san_pham, sp.gia " +
      "FROM gio_hang gh JOIN san_pham sp ON gh.ma_san_pham = sp.ma_san_pham " +
      "WHERE gh.ma_tai_khoan = $1",
      [user.ma_tai_khoan]
    );
    const cartItems = cartItemsResult.rows;

    const totalPrice = cartItems.reduce((sum, item) => sum + item.gia * item.so_luong, 0);

    res.render("shopping_cart", { cartItems, totalPrice });
  } catch (error) {
    console.error("Lỗi khi tải giỏ hàng:", error);
    res.status(500).send("Đã xảy ra lỗi khi tải giỏ hàng.");
  }
});
app.get("/shopping_cart", async (req, res) => {
  try {
    const user = req.user;
    if (!req.isAuthenticated() || !user.ma_tai_khoan) {
      console.log("User not authenticated or ma_tai_khoan missing:", user);
      return res.redirect("/login");
    }

    const cartItemsResult = await db.query(
      "SELECT gh.ma_san_pham, gh.so_luong, sp.hinh_anh, sp.ten_san_pham, sp.gia " +
      "FROM gio_hang gh JOIN san_pham sp ON gh.ma_san_pham = sp.ma_san_pham " +
      "WHERE gh.ma_tai_khoan = $1",
      [user.ma_tai_khoan]
    );
    const cartItems = cartItemsResult.rows;

    const totalPrice = cartItems.reduce((sum, item) => sum + item.gia * item.so_luong, 0);

    res.render("shopping_cart", { cartItems, totalPrice });
  } catch (error) {
    console.error("Lỗi khi tải giỏ hàng:", error);
    res.status(500).send("Đã xảy ra lỗi khi tải giỏ hàng.");
  }
});

app.post("/update_cart_quantity", async (req, res) => {
  try {
    const { cartItemId, quantity } = req.body;
    
    if (quantity <= 0) {
      // Nếu số lượng <= 0, xóa sản phẩm khỏi giỏ hàng
      await db.query("DELETE FROM Gio_hang WHERE Ma_san_pham = $1", [cartItemId]);
    } else {
      // Cập nhật số lượng
      await db.query("UPDATE Gio_hang SET So_luong = $1 WHERE Ma_san_pham = $2", [quantity, cartItemId]);
    }
    res.send("<script>alert('Cập nhật thành công!'); window.location.href = '/shopping_cart';</script>");
  } catch (error) {
    console.error("Lỗi khi cập nhật giỏ hàng:", error);
    res.status(500).send("Đã xảy ra lỗi khi cập nhật giỏ hàng: " + error.message);
  }
});

app.post("/remove_cart_item", async (req, res) => {
  try {
    const { cartItemId } = req.body;       
    await db.query("DELETE FROM Gio_hang WHERE Ma_san_pham = $1", [cartItemId]);
    res.send("<script>alert('Xóa thành công!'); window.location.href = '/shopping_cart';</script>");
  } catch (error) {
    console.error("Lỗi khi xóa sản phẩm khỏi giỏ hàng:", error);
    res.status(500).send("Đã xảy ra lỗi khi xóa sản phẩm khỏi giỏ hàng: " + error.message);
  }
});

app.post("/buy", async(req, res) => {
  try {
    const product_id = req.body.product_id;
    const quantity = req.body.quantity || 1;
    
    // Cập nhật số lượng sản phẩm
    await db.query("UPDATE San_pham SET So_luong = So_luong - $1 WHERE Ma_san_pham = $2", [quantity, product_id]);
    
    // Lấy thông tin khách hàng và nhân viên (giả sử lấy ID đầu tiên cho demo)
    const customerResult = await db.query("SELECT Ma_khach_hang FROM Khach_hang LIMIT 1");
    const staffResult = await db.query("SELECT Ma_nhan_vien FROM Nhan_vien LIMIT 1");
    
    const customerId = customerResult.rows[0].Ma_khach_hang;
    const staffId = staffResult.rows[0].Ma_nhan_vien;
    
    // Lấy thông tin giá sản phẩm
    const productResult = await db.query("SELECT Gia FROM San_pham WHERE Ma_san_pham = $1", [product_id]);
    const productPrice = productResult.rows[0].Gia;
    
    // Tạo hóa đơn mới
    const invoiceResult = await db.query(
      "INSERT INTO Hoa_don (Ma_khach_hang, Ma_nhan_vien, Ma_hoa_don, Ngay_lap, Tong_tien) VALUES ($1, $2, nextval('hoa_don_seq'), CURRENT_DATE, $3) RETURNING Ma_hoa_don",
      [customerId, staffId, productPrice * quantity]
    );
    
    const invoiceId = invoiceResult.rows[0].Ma_hoa_don;
    
    // Thêm chi tiết hóa đơn
    await db.query(
      "INSERT INTO Chi_tiet_hoa_don (Ma_san_pham, Ma_hoa_don, So_luong, Don_gia) VALUES ($1, $2, $3, $4)",
      [product_id, invoiceId, quantity, productPrice]
    );
    
    res.send("<script>alert('Đặt hàng thành công!'); window.location.href = '/detail_product';</script>");
  } catch(error) {
    console.error("Lỗi khi đặt hàng:", error);
    res.status(500).send("Đã xảy ra lỗi khi đặt hàng: " + error.message);
  }
});

app.post("/evaluation", async (req, res) => {
  try {
    const { product_id, name, email, content, date, star } = req.body;
    
    // Kiểm tra đầy đủ các trường
    if (!product_id || !name || !email || !content || !date || !star) {
      return res.status(400).json({ 
        success: false, 
        message: "Vui lòng điền đầy đủ thông tin!" 
      });
    }
    
    // Kiểm tra định dạng email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: "Email không hợp lệ!" 
      });
    }
    
    // Kiểm tra số sao
    const starRating = parseInt(star);
    if (isNaN(starRating) || starRating < 1 || starRating > 5) {
      return res.status(400).json({ 
        success: false, 
        message: "Số sao phải từ 1 đến 5!" 
      });
    }
    
    // Kiểm tra định dạng ngày
    let validDate;
    try {
      validDate = new Date(date);
      if (isNaN(validDate.getTime())) throw new Error("Invalid date");
    } catch (error) {
      return res.status(400).json({ 
        success: false, 
        message: "Định dạng ngày không hợp lệ (Ví dụ: 2025-03-15 09:30:00)!" 
      });
    }
    
    // Kiểm tra product_id tồn tại
    const productCheck = await db.query(
      "SELECT ma_san_pham FROM San_pham WHERE ma_san_pham = $1",
      [product_id]
    );
    
    if (productCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Không tìm thấy sản phẩm!" 
      });
    }
    
    // Thêm đánh giá vào cơ sở dữ liệu với prepared statement
    await db.query(
      "INSERT INTO thong_tin_danh_gia (Ten_nguoi_gui, Email, Noi_dung, Ngay_danh_gia, So_sao, ma_san_pham) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [name, email, content, validDate, starRating, product_id]
    );
    res.send(`<script>alert('Cảm ơn bạn đã gửi đánh giá!'); window.location.href = '/product_detail_phone?ma_san_pham=${product_id}';</script>`);
    // Phản hồi thành công dạng JSON để dễ xử lý phía client
   
    
  } catch (error) {
    console.error("Lỗi khi thêm đánh giá:", error);
    // Không trả về chi tiết lỗi cho người dùng
    return res.status(500).json({ 
      success: false, 
      message: "Đã xảy ra lỗi khi thêm đánh giá. Vui lòng thử lại sau." 
    });
  }
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});

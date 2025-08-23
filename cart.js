document.addEventListener("DOMContentLoaded", function() {
    // Tìm tất cả các form thêm vào giỏ hàng
    const addToCartForms = document.querySelectorAll('form[action="/add_to_shopping_cart"]');
    
    addToCartForms.forEach(form => {
      form.addEventListener('submit', function(e) {
        e.preventDefault();  // Ngăn form submit theo cách thông thường
        
        // Tạo FormData object để lấy dữ liệu form
        const formData = new FormData(this);
        
        // Gửi request AJAX
        fetch('/add_to_shopping_cart', {
          method: 'POST',
          body: formData
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            // Cập nhật số lượng trong giỏ hàng ở header
            const cartCountElement = document.querySelector('.cart-count');
            if (cartCountElement) {
              cartCountElement.textContent = data.cartCount;
            }
            
            // Hiển thị thông báo (tùy chọn)
            alert(data.message);
          } else {
            alert(data.message || 'Có lỗi xảy ra');
          }
        })
        .catch(error => {
          console.error('Lỗi:', error);
          alert('Có lỗi xảy ra khi xử lý yêu cầu');
        });
      });
    });
  });
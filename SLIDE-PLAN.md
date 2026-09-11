# SLIDE-PLAN — Rate limiter ở LoanBud

Quy trình theo repo `slides-vibe-coding-sops`: viết plan trước, rồi mới viết `index.html`.
Phong cách theo `~/Downloads/DESIGN.md`: nền trắng, chữ ink `#222`, một màu nhấn Rausch `#ff385c`,
bo góc 14–20px, một tầng shadow, Inter (bản thay thế Cereal mà DESIGN.md chỉ định), IBM Plex Mono cho code.
Chỉ có giao diện sáng, vì DESIGN.md ghi rõ không có dark mode.

## Bố cục dùng lại

- **cover**: tiêu đề trái, "thẻ HTTP 429" phải.
- **split**: hình trái (≈60%), chữ phải (≈40%). Hình là SVG vẽ theo đúng thang đo.
- **trio**: ba thẻ ngang hàng, chỉ dùng khi có đúng ba thứ để so sánh.
- **table**: bảng đối chiếu, số căn cột bằng `tabular-nums`.

Mỗi slide: một tiêu đề, tối đa ~40 từ nội dung, chân slide ghi đường dẫn file nguồn.

## Danh sách slide

| # | Tiêu đề | Bố cục | Hình / tương tác | Bước (data-step) |
|---|---|---|---|---|
| 1 | Rate limiter ở LoanBud | cover | Thẻ `429 Too Many Requests` | — |
| 2 | Hai chiều, không có gateway | full | Sơ đồ client → ALB → pod → vendor | 1: hộp "WAF/nginx/ingress: không có" |
| 3 | Thùng 5 token, nạp 5 token mỗi giây | split | Gantt 10 luồng gọi cùng lúc | 1: luồng 6–10 |
| 4 | Mượn trước rồi ngủ đúng phần thiếu | split | Code `LendingWiseRatePacer.acquire()` | 1–3: ba ý |
| 5 | Leaky bucket: xả đều, không cho burst | split | Lý tưởng vs sweep HubSpot (chia nguyên) | 1: ghi chú chia nguyên |
| 6 | Fixed window và cú dồn ở ranh giới | split | Hai bậc thang chạm limit = 10 | 1: cửa sổ B, 2: ngoặc "19 lần" |
| 7 | Ba limiter chiều vào | table | Login · Draft · OTP | — |
| 8 | Login: ba quyết định đúng | trio | Key, 401, hop cuối XFF | — |
| 9 | Sliding window log | split | Mốc thời gian + ZSET | — |
| 10 | Sliding window counter | split | Widget kéo thanh trượt | — |
| 11 | Đếm ở đâu thì limit thật là bao nhiêu | trio | Heap / process / Redis | — |
| 12 | INCR rồi mới EXPIRE | split | Code hiện tại vs Lua | 1: Lua |
| 13 | Khi vendor trả 429 | two-up | HubSpot vs LendingWise gate | 1: dải pacer/gate |
| 14 | Ba kiểu backoff đang chạy | table | Outbox · OCR · service-crm | — |
| 15 | Không có jitter, 1.000 retry đến cùng lúc | full | Histogram, chuyển 3 chế độ | — |
| 16 | Ba công thức jitter | split | Bảng + code service-crm | 1: ghi chú ×1.5 |
| 17 | Có Retry-After vẫn cần jitter | split | Histogram 60s vs 60s + 20% | — |
| 18 | Năm việc rút ra | list | Chip mức độ | — |

## Phím tắt (giống repo tham khảo)

`→` / `Space` bước kế · `←` lùi · `N` ghi chú người nói · `O` lưới tổng quan · `F` toàn màn hình ·
`#6.2` link thẳng tới slide 6 bước 2 · In ra PDF: mỗi slide một trang, mọi bước hiện sẵn.

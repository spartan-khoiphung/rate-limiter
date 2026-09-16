# SCRIPT-VI — Kịch bản thuyết trình (tiếng Việt)

> Deck chính (`index.html`) vẫn giữ nguyên tiếng Anh. File này là **kịch bản nói** bằng tiếng
> Việt, giống cách repo tham khảo `slides-vibe-coding-sops` tách riêng `SCRIPT.md` khỏi slide —
> dùng để thuyết minh khi trình bày, không phải nội dung hiển thị trên màn hình.
>
> Phạm vi: chỉ những slide có **diagram kiến trúc sống** (Archify) — đây là phần khó tự đọc hiểu
> nhất nếu không có người giải thích, nên đây là phần đáng đầu tư kịch bản nói nhất. Các slide
> thuật toán/chart tương tác khác đã tự giải thích qua caption + tương tác trực tiếp.

---

## Slide "Where it lives" (`topology`, §2)

*Mở deck lên, diagram 3 cột: Client → Gateway → Application, và 1 nhánh riêng Application →
Third-party API.*

> "Đây là bức tranh tổng: rate limiting không nằm ở một chỗ. Có 2 hướng hoàn toàn khác nhau.
> Hướng thứ nhất — bảo vệ chính mình khỏi client bên ngoài, đi qua Gateway rồi tới Application.
> Hướng thứ hai — mình đóng vai client, gọi ra một API bên thứ ba, và **họ** mới là bên có quyền
> giới hạn mình. Hai bài toán khác nhau hoàn toàn: một bên là 'tôi kiểm soát ai được vào', một bên
> là 'tôi phải cư xử cho đúng mực khi gọi ra ngoài'. Ba slide case-study cuối deck đều thuộc hướng
> thứ hai này — vì đó là chỗ có code thật, không phải ví dụ mẫu."

---

## Slide "A real audit, not a hypothetical" (`case-study` — defense gap)

*Diagram: 4 endpoint (Login, OTP, Partner API, Application Intake) đều nối vào "Rate Limiting";
chỉ Application Intake nối thêm vào "reCAPTCHA v3".*

> "Đây không phải ví dụ giả định — đây là kết quả đọc code thật của một hệ thống đang chạy.
> Nhìn vào sơ đồ: mọi endpoint đều có rate limiting, tốt. Nhưng nhìn kỹ hơn — chỉ có đúng 1 đường
> nối tới lớp chống bot (reCAPTCHA). Login và OTP — chính 2 chỗ hay bị brute-force nhất — **không
> có CAPTCHA nào cả**, chỉ dựa vào đếm số lượng.
>
> Còn chỗ duy nhất có reCAPTCHA thì lại dùng phiên bản v3 — loại trả về **điểm số tin cậy** từ
> 0 đến 1 — nhưng code chỉ kiểm tra token có hợp lệ hay không, **không đọc điểm số đó**. Nghĩa là
> tính năng đắt giá nhất của v3 đang bị bỏ phí.
>
> Bài học rút ra: rate limiting và CAPTCHA là 2 lớp phòng thủ khác nhau, bổ sung cho nhau — một
> bên đếm *số lượng*, một bên đánh giá *độ tin cậy*. Có đủ 2 lớp không có nghĩa là được bảo vệ tốt
> — phải đặt đúng chỗ và dùng hết khả năng của nó."

---

## Slide "Proactive pacing, reactive gate" (`case-study-pacer`)

*Diagram workflow: Outbound Call → Rate Pacer → Rate Gate → LendingWise API → Error Decoder →
Response; 2 nhánh rẽ "Throws" khi Pacer/Gate chặn; 1 nhánh tới "gate.close()" khi gặp 429.*

> "Đây là ví dụ thật của Token Bucket đang chạy trong production — không phải sơ đồ minh hoạ lý
> thuyết như slide trước, mà đúng 2 class thật: `LendingWiseRatePacer` và
> `LendingWiseRateLimitGate`.
>
> Chú ý: có **2 lớp**, không phải 1.
>
> Lớp thứ nhất — Pacer — chạy **trước**, mang tính chủ động. Nó giữ 1 thùng token, mỗi lần gọi ra
> vendor phải lấy 1 token. Hết token thì tự ngủ đúng phần thiếu, không gọi luôn — mục tiêu là
> **đừng bao giờ để bị 429**.
>
> Lớp thứ hai — Gate — chạy **sau**, mang tính phản ứng. Nó chỉ hoạt động khi *đã* bị 429 một
> lần rồi. Lúc đó, nó đóng một cánh cổng chung cho *toàn bộ process* trong một khoảng thời gian —
> nghĩa là nếu có 10 luồng đang cùng muốn gọi ra vendor, chỉ cần 1 luồng bị 429 thì cả 10 luồng
> đều biết ngay lập tức, không ai phải tự thử rồi tự bị từ chối riêng lẻ.
>
> Đây chính là điểm khác biệt quan trọng giữa 'phòng ngừa' và 'chữa cháy' — và hệ thống thật dùng
> cả hai, không chỉ một."

---

## Slide "What 'park' actually means" (`case-study-park`)

*Diagram workflow: processBatch() → Catch Exception → releaseBatch() → park() → rẽ nhánh
"wait = retryAfter" / "wait = maxPark" → sleep(wait).*

> "Slide này trả lời đúng câu hỏi hay bị nhầm: **Retry-After không phải là 'park'**. Retry-After
> chỉ là 1 con số — vendor gửi qua header, nói 'chờ bao nhiêu giây'. Park là **toàn bộ quy trình**
> phản ứng với con số đó.
>
> Nhìn theo thứ tự: khi worker bắt được lỗi rate-limit, việc đầu tiên nó làm **không phải** là
> ngủ ngay — mà là **nhả hết file đang giữ dở** về lại hàng chờ (`releaseBatch`). Tại sao? Vì
> nếu giữ nguyên rồi ngủ, worker sẽ không gửi tín hiệu 'tôi vẫn sống' (heartbeat) trong lúc ngủ —
> hệ thống điều phối có thể tưởng nó đã chết, thu hồi luôn cả những phần việc khác nó đang giữ,
> gây ra tranh chấp không cần thiết.
>
> Sau khi nhả xong, mới tới bước quyết định chờ bao lâu — đây là chỗ hay nhất: nó **không tin
> tuyệt đối** vào con số vendor gửi. Có trần tối đa 60 giây — dù vendor nói chờ lâu hơn cũng chỉ
> chờ tối đa 60 giây, để không làm hỏng cơ chế heartbeat nói trên. Và nếu đã park liên tiếp hơn 2
> lần rồi mà vẫn dính rate-limit — nghĩa là con số vendor gửi không phản ánh đúng thực tế nữa —
> nó **bỏ qua hẳn** con số đó, chờ luôn mức trần an toàn.
>
> Tóm 1 câu: Retry-After là dữ liệu đầu vào; park là cả một chiến lược xử lý dữ liệu đó một cách
> an toàn."

---

## Gợi ý chuyển tiếp giữa 3 slide case-study

Ba slide này kể liền một câu chuyện, nên chuyển ý như sau:

1. **Defense gap** — "đây là *cái gì đang thiếu*" (rate limit có nhưng CAPTCHA đặt sai chỗ).
2. **Pacer + Gate** — "đây là *cái đã làm đúng*" (2 lớp bổ sung nhau khi gọi ra vendor).
3. **Park** — "đây là *điều xảy ra tiếp theo*" khi lớp phòng thủ đó thực sự bị kích hoạt.

Câu chốt sau slide 3: *"Rate limiting không phải là một dòng code chặn 429 — nó là một chuỗi
quyết định: chặn ở đâu, phản ứng thế nào khi vượt ngưỡng, và tin đối phương đến mức nào khi họ
nói 'chờ tôi một chút'."*

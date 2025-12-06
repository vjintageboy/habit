# 🔧 Fix Check-in Error

## Vấn đề
Lỗi `TypeMismatch` khi check-in do contract chưa được rebuild với signature mới.

## Giải pháp

### Bước 1: Rebuild Contract

Contract đã được thay đổi:
- ✅ Thêm `entry` vào tất cả functions
- ✅ Đổi `check_in` từ `Option<String>` sang `vector<u8>`

**Chạy lệnh sau để rebuild:**

```bash
cd contract/habit
iota move build
```

Nếu gặp lỗi permission, thử:
```bash
iota move build --skip-fetch-latest-git-deps
```

### Bước 2: Redeploy Contract

Sau khi build thành công, redeploy:

```bash
npm run iota-deploy
```

Hoặc manual:
```bash
cd contract/habit
iota client publish --gas-budget 100000000 habit
```

Sau đó copy Package ID và update `lib/config.ts`

### Bước 3: Test lại

1. Refresh browser
2. Thử check-in lại
3. Lỗi sẽ hết vì:
   - Contract signature đã match (vector<u8>)
   - Entry functions đã được thêm
   - Frontend đã được cập nhật

## Lưu ý

- Nếu đã có habits trên blockchain với contract cũ, có thể cần tạo lại habits vì signature đã thay đổi
- Đảm bảo Package ID trong `lib/config.ts` được update sau khi deploy

## Nếu vẫn lỗi

Kiểm tra:
1. Contract đã được build thành công chưa?
2. Package ID trong `lib/config.ts` đã đúng chưa?
3. Browser console có lỗi gì khác không?


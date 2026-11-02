1. fix avt /login bị trùng với icon menu trong /logout

2. chỉnh lại cái function Menu() and <Tippy> 3. set riêng mỗi icon pomernent không dùng chung

3. fix khi trang login và logout khi chuyển đổi lẫn nhau
   vẫn giữ menu của đợt log trươc không tự update

// set key

// <Menu items={currentUser ? userMenu : MENU_ITEMS} onChange={handleMenuChange}>

// 'components/Layout/components\Header/index.js'
// 'components\Popper\Menu\index.js'

4. add api tiktok
   // seach, suggested accounts, following accounts

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

5. - Profile: personal, suggested, following
   - Scrollbar: custom thanh cuộn mỏng (sidebar hover, menu)
   - Fixed header
   - Feed actions: position absolute

6. - foryou(overlay)
7. - following(following accounts, overlay)
8. - live(overlay, icon, view)
9. - edit profile
10.   - fix bug:
         - logout không follow(container request login)
         - logout không edit profile(container request login)
         - view profile (/@bear)

11.   - Bug:
         - onclick profile + tab -> nảy nhiều popper acc cùng 1 lúc không ẩn đi
         - search + onclick profile không ẩn popper search profile
         - button ^ / ^? bỏ gắn bên siderbar

12.   - fix:
         - add trigger
         - onclickOutside -> onClick = setShowResult(false)
         - faChevronUp, faChevronDown loại bỏ khỏi /feed, /following, /live
13.   - search
         - search-more (See all results for 'text')
         - tabs-container
      - cmt
         - onClick cmt -> popper comments
         - popper comments (avt, text, accounts(không có onClick -> profile))
         - comments (add comments, reply, like)
         - foryou, following use cmt (live không có)
         * bug: popper cmt đè Header
14.   - Following
         - follow sugested accounts -> + img or video -> /following
         - unfollow -> - img or video /following
15.   - video
         - add mute-btn
         - Mute, Unmute
         * bug: chưa add up down mute (âm thanh bị )
16.   - fix: 
         - popper cmt  không đè lên thanh header
17.   - inbox:
         -   popper Notifications
         -   onClick Notifications -> profile
         -   scroll ngang dọc
18.   - profile:
         -   list-item 

#### api nhiều data load chậm

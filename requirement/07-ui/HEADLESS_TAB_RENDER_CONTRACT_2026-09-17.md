# Headless Tab Render Contract — 2026-09-17

## Mục tiêu

Kiểm tra hành vi render thật của toàn bộ panel UI trong một DOM harness, bổ sung cho static surface contract. Mỗi tab canonical phải render được với state mới hợp lệ, không throw exception và không đưa placeholder runtime ra HTML.

## Phạm vi tab

`status`, `inventory`, `quests`, `relations`, `guilds`, `map`, `memory`, `world`, `oddities`, `expansion`, `market`, `qintian`, `cauldron`.

## Regression

`tools/verify_game.js` gọi `GameUI.renderPanel` trên từng tab, bắt exception, HTML rỗng và token `undefined`, `NaN`, `Cannot read`, `TypeError`.

## Giới hạn

Harness không đo pixel layout, font, responsive breakpoints, asset network loading hoặc FPS thật; các gate đó vẫn cần browser/device QA.

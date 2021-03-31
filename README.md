# Plumbing store

Santexnika sotuvchi do'kon uchun ichki boshqaruv tizimi. Foydalanuvchilar: **direktor**, **sotuvchi**, **yuk tashuvchi**. Sotuvchi do'kondagi tovarlarni sotayotgan vaqtda saytdan tovarlarni tanlaydi, va sotganini belgilaydi. Va bu realtime'da direktorga ko'rinib turadi. Sotilgan tovar do'konni o'zida emas omborda bo'lganligi uchun yuk tashuvchilardan biri xaridni qabul qiladi va tovarlarni xaridorga yektazib beradi. Bularni barchasini realtime'da bo'ladi. Direktor tovarlarni, ishchilarni boshqarishi, xaridlarni ko'rib turishi mumkin

## Technologies

**Library**: Express.js \
**Database**: MongoDB \
**ORM**: Mongoose \
**Other**: Socket.io \
**Frontend**: Html/Css/jQuery


## Installation

Dependencies:
- Node.js
- Npm
- MongoDB

**1. Start main backend server**

```bash
cd Backend
npm install
node server.js
```

**2. Start seller client server**
```bash
cd Seller Client
npm install
node app.js
```

**3. Start director client server**
```bash
cd Seller Client
npm install
node app.js
```

**4. Start worker client server**
```bash
cd Worker Client
npm install
node app.js
```


**Director client**: [localhost:3003](http://localhost:3003) \
**Seller client**: [localhost:2002](http://localhost:2002) \
**Worker client**: [localhost:4004](http://localhost:4004)

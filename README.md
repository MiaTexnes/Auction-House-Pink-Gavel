# Auction House - Pink Gavel 🔨

![Project Banner](assets/images/logo.png)

**A modern, responsive auction platform built with vanilla JavaScript and Tailwind CSS**

## 🎯 About the Project

Auction House - Pink Gavel is a full-featured front-end application for an online auction platform. Users can list items for auction, place bids, and manage their bids and profile in a sleek, modern interface. This project demonstrates advanced front-end development skills including API integration, responsive design, and comprehensive testing.

**🔗 [Live Demo](https://pinkgavel.netlify.app)** | **📚 [API Documentation](https://docs.noroff.dev/docs/v2)**

### Built With

**JavaScript (ES6+)** - Modern vanilla JavaScript
**Tailwind CSS v3.4.17** - Utility-first CSS framework
**Vite** - Fast build tool and dev server
**Vitest** - Unit testing framework
**ESLint** - Linting and code quality
**Husky** - Git hooks for code quality
**Noroff Auction API** - Backend services

## ✨ Features

### 🔐 Authentication & User Management

- **Secure Registration** - Only users with `stud.noroff.no` email domains
- **Login/Logout** - Persistent authentication with JWT tokens
- **Profile Management** - Update avatar, Bio and view account details
- **Credit System** - Track and see bidding credits

### 🏷️ Auction Listings

- **Create Listings** - Add items with title, description, images, and deadline
- **Edit and Delete Listings** - Edit and delete listings
- **Media Gallery** - Multiple image support for listings
- **Search & Filter** - Advanced search functionality for all users
- **Bidding System** - Place bids and view bidding history

### 👤 User Roles

- **Registered Users**: Full access to bidding, listing creation, item management and profile management
- **Guest Users**: Browse and search listings without registration

### 🎨 UI/UX Features

- **Responsive Design** - Mobile-first approach with Tailwind CSS
- **Dark/Light Mode** - Toggle between themes
- **Interactive Components** - Modals, carousels, and dynamic forms
- **Accessibility** - WCAG compliant interface tested with WAVE

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **Git**

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/MiaTexnes/Auction-House-Pink-Gavel.git
   cd Auction-House-Pink-Gavel
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start development server**

   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Testing
npm run test         # Run Vitest
npm run test:run     # Run the tests once
npm run test:coverage # Generate coverage report

# Code Quality
npm run format       # Format code with Prettier
npm run format:check # Check formatting
npm run prepare      # Install Husky hooks
```

## 🧪 Testing

This project includes testing with **Vitest**:

- **Unit Tests** - Components and utility functions
- **Integration Tests** - API services and user flows
- **Coverage Reports** - Generated in `/coverage` directory

Run tests with:

```bash
npm run test:coverage
```

View coverage reports by opening `coverage/index.html` in your browser.

## 📁 Project File Structure

<details>
  <summary>Click to expand</summary>

```text
├── assets/
│   ├── favicon/
│   │   ├── favicon-96x96.png
│   │   ├── favicon.ico
│   │   ├── favicon.svg
│   │   ├── site.webmanifest
│   │   ├── web-app-manifest-192x192.png
│   │   └── web-app-manifest-512x512.png
│   └── images/
│       └── logo.png
├── coverage/
│   ├── base.css
│   ├── block-navigation.js
│   ├── clover.xml
│   ├── coverage-final.json
│   ├── favicon.png
│   ├── index.html
│   ├── prettify.css
│   ├── prettify.js
│   ├── sort-arrow-sprite.png
│   └── sorter.js
├── public/
│   ├── site.webmanifest
│   ├── vite.svg
│   ├── assets/
│   │   ├── favicon/
│   │   └── images/
│   └── favicon/
│       ├── favicon-96x96.png
│       ├── favicon.ico
│       ├── favicon.svg
│       ├── site.webmanifest
│       ├── web-app-manifest-192x192.png
│       └── web-app-manifest-512x512.png
├── src/
│   ├── main.js
│   ├── components/
│   │   ├── buttons.js
│   │   ├── carousel.js
│   │   ├── darkLight.js
│   │   ├── footer.js
│   │   ├── header.js
│   │   ├── modalManager.js
│   │   └── searchAndSort.js
│   ├── config/
│   │   └── faviconConfig.js
│   ├── css/
│   │   └── style.css
│   ├── library/
│   │   ├── auth.js
│   │   └── newListing.js
│   ├── pages/
│   │   ├── contact.js
│   │   ├── faq.js
│   │   ├── index.js
│   │   ├── item.js
│   │   ├── listings.js
│   │   ├── login.js
│   │   ├── profile.js
│   │   ├── register.js
│   │   └── sellerProfile.js
│   ├── services/
│   │   ├── baseApi.js
│   │   ├── biddingService.js
│   │   ├── config.js
│   │   ├── faviconService.js
│   │   ├── inactivityService.js
│   │   └── themeService.js
│   ├── tests/
│   │   ├── auth.test.js
│   │   ├── baseApi.test.js
│   │   ├── biddingService.test.js
│   │   ├── buttons.test.js
│   │   ├── carousel.test.js
│   │   ├── example.test.js
│   │   ├── requestManager.test.js
│   │   ├── searchAndSort.test.js
│   │   ├── timeUtils.test.js
│   │   └── utils.test.js
│   └── utils/
│       ├── dateUtils.js
│       ├── profileUtils.js
│       ├── requestManager.js
│       ├── tagUtils.js
│       └── timeUtils.js
├── contact.html
├── cookies.html
├── faq.html
├── index.html
├── item.html
├── listings.html
├── login.html
├── netlify.toml
├── package.json
├── postcss.config.js
├── prettier.config.json
├── privacy.html
├── profile.html
├── README.md
├── register.html
├── sellerProfile.html
├── tailwind.config.js
├── terms.html
├── TESTING.md
├── vite.config.js
└── ...
```

</details>

## 🔧 Configuration

### Environment Setup

A .env file is required. Add the following variables:

`VITE_NOROFF_API_KEY=your-api-key-here`
`VITE_API_BASE_URL=your-api-url-here`

### Tailwind CSS

See `tailwind.config.js`.

### Netlify Deployment

The project is deployed on Netlify from `main`.

- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Live site**: https://pinkgavel.netlify.app/

The app calls the Noroff API through `VITE_API_BASE_URL`. There is no Netlify function.

## 🎨 Design System

The project follows a cohesive design system:

- **Color Palette**: Pink-themed with support for dark/light modes
- **Typography**: Responsive text scaling
- **Components**: Consistent button styles, modals, and form elements
- **Layout**: Mobile-first responsive grid system

Design files are available in [Figma](https://www.figma.com/design/3v4qxEUA5xGW2cc85RB03f/Pink-Gavel-Auctions?node-id=0-1&t=Fv91dtswe4VxmP1L-1).

## 📊 Project Management

Development is tracked using GitHub Projects with:

- **📋 [Kanban Board](https://github.com/MiaTexnes/Auction-House-Pink-Gavel/projects)** - Task management
- **📈 Gantt Charts** - [Timeline tracking](https://github.com/users/MiaTexnes/projects/7/views/1)
- **🐛 Issues** - Bug tracking and feature requests

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the project
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Mia Texnes**

- GitHub: [@MiaTexnes](https://github.com/MiaTexnes)
- Project Link: [Auction House - Pink Gavel](https://github.com/MiaTexnes/Auction-House-Pink-Gavel)

## 🙏 Acknowledgments

- **Noroff Education** - For providing the auction API and project requirements
- **Tailwind CSS** - For the excellent utility-first CSS framework
- **Vite** - For the blazing fast development experience
- **Netlify** - For seamless deployment and hosting

<div align="center">
  Made with ❤️ for Noroff Semester Project 2
</div>

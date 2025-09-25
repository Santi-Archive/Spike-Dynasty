# Volleyball Manager v0.2.0

A clean, well-documented volleyball team management application built with HTML, CSS, and JavaScript using BEM methodology.

## 🏐 Features

### Dashboard

- **Calendar System**: Interactive calendar with match days and training sessions
- **Season Progress**: Track your team's progress through the season
- **Match Simulation**: Quick access to match simulation on match days

### Team Management

- **Player Roster**: View all team players with detailed statistics
- **Player Details**: Comprehensive player information including stats and contract details
- **Search & Filter**: Find players by name, position, or nationality
- **Sorting**: Sort players by various attributes (overall rating, age, etc.)

### Squad Selection

- **Drag & Drop Interface**: Intuitive squad selection with drag-and-drop functionality
- **Position Validation**: Ensures players are placed in correct positions
- **Starting Lineup**: 7 starting positions (2 Outside Hitters, 2 Middle Blockers, 1 Setter, 1 Opposite Hitter, 1 Libero)
- **Bench Management**: 9 bench slots for substitute players

### Standings

- **League Tables**: View standings for multiple leagues
- **Team Information**: Click on teams to view detailed information
- **Interactive Tables**: Sort and filter standings data

### Transfer Market

- **Available Players**: Browse players available for transfer
- **Make Offers**: Submit transfer offers for desired players
- **Manage Offers**: Accept or reject incoming transfer offers
- **Player Details**: View comprehensive player information before making offers

### Match Simulation

- **Realistic Simulation**: Team strength-based match outcomes
- **Quick Simulation**: Instant results for testing
- **Match History**: Track all simulated matches
- **Season Statistics**: Monitor team performance over time

## 🛠️ Technical Details

### Architecture

- **Modular Design**: Clean separation of concerns with component-based architecture
- **BEM Methodology**: Consistent CSS naming convention for maintainable styles
- **Responsive Design**: Mobile-first approach with responsive breakpoints
- **Error Handling**: Comprehensive error handling and user feedback

### File Structure

```
vbm-0.2/
├── index.html              # Main HTML file
├── styles.css              # Main stylesheet with BEM classes
├── players.json            # Team player data
├── transfer-players.json   # Transfer market player data
├── js/
│   ├── main.js            # Application coordinator
│   ├── utils/
│   │   ├── domHelpers.js  # DOM manipulation utilities
│   │   ├── dataStorage.js # Data management utilities
│   │   └── modalHelpers.js # Modal management utilities
│   └── components/
│       ├── dashboard.js   # Dashboard component
│       ├── teamManagement.js # Team management component
│       ├── squadSelection.js # Squad selection component
│       ├── standings.js   # Standings component
│       ├── transferMarket.js # Transfer market component
│       └── matchSimulation.js # Match simulation component
└── README.md              # This file
```

### CSS BEM Methodology

The CSS follows BEM (Block Element Modifier) methodology for maintainable and scalable styles:

- **Block**: `.app`, `.sidebar`, `.player-card`
- **Element**: `.app__mobile-toggle`, `.sidebar__nav-item`, `.player-card__name`
- **Modifier**: `.sidebar__nav-item--active`, `.player-card__overall--large`

### JavaScript Architecture

- **Component-based**: Each feature is a separate component
- **Global Namespace**: Components are attached to `window` object for easy access
- **Error Handling**: Comprehensive try-catch blocks with user notifications
- **Documentation**: Extensive JSDoc comments for all functions

## 🚀 Getting Started

### Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Local web server (for JSON file loading)

### Installation

1. Clone or download the project files
2. Serve the files using a local web server:

   ```bash
   # Using Python
   python -m http.server 8000

   # Using Node.js
   npx serve .

   # Using PHP
   php -S localhost:8000
   ```

3. Open your browser and navigate to `http://localhost:8000`

### Usage

1. **Dashboard**: Start by viewing the calendar and season progress
2. **Team Management**: Browse your players and view their details
3. **Squad Selection**: Set up your starting lineup and bench
4. **Standings**: Check league standings and team performance
5. **Transfer Market**: Browse available players and manage offers
6. **Match Simulation**: Simulate matches and track results

## 📱 Responsive Design

The application is fully responsive and works on:

- **Desktop**: Full sidebar navigation and grid layouts
- **Tablet**: Optimized layouts with adjusted grid columns
- **Mobile**: Collapsible sidebar and single-column layouts

## 🎨 Styling

### Color Scheme

- **Primary**: Purple gradient (#6366f1 to #8b5cf6)
- **Secondary**: Gray tones (#374151 to #4b5563)
- **Success**: Green (#22c55e)
- **Error**: Red (#ef4444)
- **Background**: Dark theme with gradients

### Typography

- **Font Family**: Inter (Google Fonts)
- **Weights**: 400 (Regular), 600 (Semi-bold), 700 (Bold)

## 🔧 Customization

### Adding New Players

Edit `players.json` to add new team players:

```json
{
  "name": "Player Name",
  "position": "Outside Hitter",
  "overall": 85,
  "age": 24,
  "jersey": 12,
  "nationality": "Country",
  "attack": 88,
  "defense": 82,
  "serve": 85,
  "block": 80,
  "receive": 84,
  "setting": 70,
  "contract": {
    "yearsRemaining": 3,
    "wagesPerMonth": 12000,
    "value": 450000,
    "team": "Your Team"
  }
}
```

### Adding Transfer Players

Edit `transfer-players.json` to add players to the transfer market.

### Modifying Styles

The CSS uses CSS custom properties (variables) for easy theming. Modify the color values in the `:root` section of `styles.css`.

## 🐛 Debugging

### Console Commands

The application provides debugging utilities accessible via the browser console:

```javascript
// Get application state
VBManager.getState();

// Reset application
VBManager.reset();

// Reload data
VBManager.reloadData();

// Show notifications
debug.showSuccess("Success message");
debug.showError("Error message");
```

### Error Handling

- All errors are logged to the console with context
- User-friendly error notifications are displayed
- Graceful fallbacks for missing data

## 📈 Performance

### Optimizations

- **Efficient DOM Manipulation**: Minimal DOM queries and updates
- **Event Delegation**: Efficient event handling
- **Lazy Loading**: Components initialize only when needed
- **Responsive Images**: Optimized for different screen sizes

### Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 🔮 Future Enhancements

### Planned Features

- **Player Development**: Training and skill improvement
- **Tactics System**: Match strategy and formations
- **Financial Management**: Budget and contract negotiations
- **Youth Academy**: Player development from youth teams
- **Statistics Dashboard**: Advanced analytics and reporting
- **Multiplayer Mode**: Online competitions and leagues

### Technical Improvements

- **State Management**: Implement proper state management
- **API Integration**: Connect to backend services
- **PWA Features**: Offline support and app-like experience
- **Testing**: Unit and integration tests
- **Build System**: Modern build tools and bundling

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues, feature requests, or pull requests.

## 📞 Support

For support or questions, please open an issue in the project repository.

---

**Volleyball Manager v0.2.0** - Built with ❤️ for volleyball enthusiasts

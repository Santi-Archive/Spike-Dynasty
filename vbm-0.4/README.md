n**: Choose and manage your team upon registration
- **Session Management**: Persistent login sessions with automatic refresh

## ��️ Technical Architecture

### Frontend Technologies
- **HTML5**: Semantic markup with accessibility features
- **CSS3**: Modern styling with BEM methodology and CSS Grid/Flexbox
- **Vanilla JavaScript**: ES6+ features with modular component architecture
- **Responsive Design**: Mobile-first approach with progressive enhancement

### Backend & Database
- **Supabase**: PostgreSQL database with real-time capabilities
- **Row Level Security**: Secure data access with user-based permissions
- **Database Migrations**: Version-controlled schema management
- **Real-time Updates**: Live data synchronization across sessions

### Database Schema
```sql
-- Core Tables
leagues (id, league_name, created_at, updated_at)
teams (id, team_name, league_id, team_money, created_at, updated_at)
players (id, player_name, position, age, country, jersey_number, 
         overall, attack, defense, serve, block, receive, setting,
         contract_years, monthly_wage, player_value, team_id)
transfers (id, player_id, from_team, to_team, price, transfer_date, status)
users (id, email, username, display_name, created_at, updated_at)
user_teams (id, user_id, team_id, created_at)
transfer_offers (id, player_id, from_user, to_user, offer_amount, 
                message, status, created_at)
```

### File Structure

vbm-0.4/
├── index.html # Main application entry point
├── styles.css # Global styles with BEM methodology
├── package.json # Project dependencies and scripts
├── SUPABASE_SETUP.md # Database setup instructions
├── database/
│ └── migrations/ # Database migration files
│ ├── 001_create_leagues_table.sql
│ ├── 002_create_teams_table.sql
│ ├── 003_create_players_table.sql
│ ├── 004_create_transfers_table.sql
│ ├── 005_add_extended_stats.sql
│ ├── 006_create_users_table.sql
│ ├── 007_create_user_teams_table.sql
│ ├── 008_create_transfer_offers_table.sql
│ └── 009_update_existing_tables_for_auth.sql
└── js/
├── main.js # Application coordinator and state management
├── config/
│ └── supabase.js # Database configuration and client setup
├── services/
│ ├── authService.js # User authentication and session management
│ ├── databaseService.js # Database operations and queries
│ └── transferOffersService.js # Transfer offer management
├── components/
│ ├── dashboard.js # Dashboard and calendar functionality
│ ├── teamManagement.js # Player roster and team management
│ ├── squadSelection.js # Squad selection and formation management
│ ├── standings.js # League standings and team comparisons
│ ├── transferMarket.js # Transfer market and player scouting
│ ├── matchSimulation.js # Match simulation engine
│ └── userManagement.js # User interface and authentication
└── utils/
├── domHelpers.js # DOM manipulation utilities
├── dataStorage.js # Data persistence and caching
├── modalHelpers.js # Modal and overlay management
├── dataMigration.js # Database migration utilities
└── playerStatsSystem.js # Player statistics and calculations

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome 80+, Firefox 75+, Safari 13+, Edge 80+)
- Node.js 16+ (for development)
- Supabase account (for database)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd vbm-0.4
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase database**
   - Follow the detailed instructions in `SUPABASE_SETUP.md`
   - Create a new Supabase project
   - Run the database migrations in order
   - Update the configuration in `js/config/supabase.js`

4. **Start the development server**
   ```bash
   npm run dev
   # or
   python -m http.server 8000
   ```

5. **Open your browser**
   Navigate to `http://localhost:8000`

### Database Setup

The application requires a Supabase PostgreSQL database. Follow these steps:

1. **Create Supabase Project**
   - Sign up at [supabase.com](https://supabase.com)
   - Create a new project
   - Note your project URL and API key

2. **Configure Application**
   - Update `js/config/supabase.js` with your credentials
   - Replace the placeholder values with your actual Supabase URL and API key

3. **Run Migrations**
   - Execute the SQL files in `database/migrations/` in order
   - The application will automatically populate initial data

## 🎮 How to Play

### Getting Started
1. **Register/Login**: Create an account or sign in
2. **Select Team**: Choose a team to manage from available options
3. **Explore Dashboard**: Get familiar with your team's current status
4. **Manage Squad**: Set up your starting lineup and bench players
5. **Browse Transfers**: Look for players to strengthen your team
6. **Simulate Matches**: Play through the season and track your progress

### Game Mechanics
- **Player Ratings**: Each player has ratings from 1-100 in different skills
- **Team Chemistry**: Player combinations affect overall team performance
- **Transfer Market**: Realistic player values based on stats, age, and potential
- **Season Progression**: Advance through days, weeks, and months
- **Match Simulation**: Results based on team strength, tactics, and form

## 🎨 Design System

### Color Palette
- **Primary**: Purple gradient (#6366f1 to #8b5cf6)
- **Secondary**: Gray tones (#374151 to #4b5563)
- **Success**: Green (#22c55e)
- **Warning**: Orange (#f59e0b)
- **Error**: Red (#ef4444)
- **Background**: Dark theme with subtle gradients

### Typography
- **Font Family**: Inter (Google Fonts)
- **Weights**: 400 (Regular), 600 (Semi-bold), 700 (Bold)
- **Responsive**: Fluid typography that scales with screen size

### BEM Methodology
The CSS follows BEM (Block Element Modifier) methodology:
```css
/* Block */
.player-card { }

/* Element */
.player-card__name { }
.player-card__stats { }

/* Modifier */
.player-card--highlighted { }
.player-card__stats--large { }
```

## 🔧 Customization

### Adding New Players
Players are managed through the Supabase database. Use the admin interface or SQL to add new players:

```sql
INSERT INTO players (player_name, position, age, country, jersey_number, 
                    overall, attack, defense, serve, block, receive, setting,
                    contract_years, monthly_wage, team_id)
VALUES ('Player Name', 'Outside Hitter', 24, 'Country', 12,
        85, 88, 82, 85, 80, 84, 70, 3, 12000, 1);
```

### Modifying Styles
The CSS uses CSS custom properties for easy theming:

```css
:root {
  --primary-color: #6366f1;
  --secondary-color: #8b5cf6;
  --background-color: #1f2937;
  /* Modify these values to change the theme */
}
```

### Database Configuration
Update the Supabase configuration in `js/config/supabase.js`:

```javascript
const SUPABASE_CONFIG = {
  url: "YOUR_SUPABASE_URL",
  anonKey: "YOUR_SUPABASE_ANON_KEY"
};
```

## 🐛 Debugging & Development

### Console Commands
The application provides debugging utilities:

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
- Comprehensive error logging with context
- User-friendly error notifications
- Graceful fallbacks for missing data
- Automatic error recovery mechanisms

### Development Tools
- **Browser DevTools**: Full debugging support
- **Console Logging**: Detailed application logs
- **Network Monitoring**: Database query tracking
- **Performance Profiling**: Built-in performance monitoring

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 768px (single column, collapsible navigation)
- **Tablet**: 768px - 1024px (adjusted grid layouts)
- **Desktop**: > 1024px (full sidebar, multi-column layouts)

### Mobile Features
- Touch-friendly interface
- Swipe gestures for navigation
- Optimized form inputs
- Responsive images and icons

## 🔒 Security Features

### Authentication
- Secure email/password authentication
- Session management with automatic refresh
- Password validation and strength requirements
- Account lockout protection

### Data Protection
- Row Level Security (RLS) policies
- User-based data access controls
- Secure API endpoints
- Input validation and sanitization

## 📈 Performance Optimizations

### Frontend
- **Lazy Loading**: Components load only when needed
- **Efficient DOM**: Minimal DOM queries and updates
- **Event Delegation**: Optimized event handling
- **Caching**: Smart data caching and persistence

### Backend
- **Database Indexing**: Optimized query performance
- **Connection Pooling**: Efficient database connections
- **Real-time Updates**: Live data synchronization
- **Query Optimization**: Efficient database queries

## �� Future Roadmap

### Planned Features
- **Multiplayer Mode**: Online leagues and competitions
- **Advanced Tactics**: Formation strategies and match plans
- **Youth Academy**: Player development from youth teams
- **Financial Management**: Budget planning and contract negotiations
- **Statistics Dashboard**: Advanced analytics and reporting
- **Mobile App**: Native mobile application
- **AI Opponents**: Intelligent computer-controlled teams

### Technical Improvements
- **State Management**: Redux or similar state management
- **Testing Suite**: Comprehensive unit and integration tests
- **CI/CD Pipeline**: Automated testing and deployment
- **Performance Monitoring**: Real-time performance tracking
- **Accessibility**: Enhanced accessibility features
- **PWA Features**: Offline support and app-like experience

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines
- Follow the existing code style and BEM methodology
- Add comprehensive JSDoc comments
- Include error handling and user feedback
- Test your changes thoroughly
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

- **Issues**: Report bugs and request features via GitHub Issues
- **Discussions**: Join community discussions
- **Documentation**: Check the `SUPABASE_SETUP.md` for database setup help

## 🙏 Acknowledgments

- **Supabase**: For providing an excellent backend-as-a-service platform
- **Inter Font**: For the beautiful typography
- **Volleyball Community**: For inspiration and feedback
- **Open Source**: Built with love for the open source community

---

**Spike Dynasty v0.4** - Built with ❤️ for volleyball enthusiasts and management game lovers

*Experience the thrill of managing your own volleyball team and leading them to victory!*

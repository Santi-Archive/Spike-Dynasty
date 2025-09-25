# Squad Selection Filter Integration

This document describes the integration of the filter component from Team Management into the Squad Selection page's available players section.

## Overview

The Squad Selection page now includes a scaled-down version of the search and filter functionality from the Team Management page, allowing users to easily find and filter players when building their squad.

## Implementation Details

### HTML Structure

Added filter controls to the available players section in `index.html`:

```html
<!-- Player Filter Controls -->
<div class="squad-filter-controls">
  <!-- Search functionality -->
  <div class="squad-filter-search">
    <div class="squad-filter-search__icon">🔍</div>
    <input
      type="text"
      class="squad-filter-search__input"
      placeholder="Search players..."
      id="squadPlayerSearch"
    />
  </div>

  <!-- Position filter buttons -->
  <div class="squad-filter-buttons">
    <button
      class="squad-filter-button squad-filter-button--active"
      data-position="all"
    >
      All
    </button>
    <button class="squad-filter-button" data-position="Outside Hitter">
      OH
    </button>
    <button class="squad-filter-button" data-position="Middle Blocker">
      MB
    </button>
    <button class="squad-filter-button" data-position="Setter">S</button>
    <button class="squad-filter-button" data-position="Libero">L</button>
    <button class="squad-filter-button" data-position="Opposite Hitter">
      OP
    </button>
  </div>
</div>
```

### CSS Styling

Created scaled-down CSS styles in `styles.css`:

#### Filter Controls Container

```css
.squad-filter-controls {
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
```

#### Search Input

```css
.squad-filter-search {
  position: relative;
  display: flex;
  align-items: center;
}

.squad-filter-search__input {
  width: 100%;
  padding: 0.5rem 0.75rem 0.5rem 2rem;
  background: rgba(31, 41, 55, 0.8);
  border: 1px solid #4b5563;
  border-radius: 0.5rem;
  color: #ffffff;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}
```

#### Filter Buttons

```css
.squad-filter-button {
  padding: 0.375rem 0.75rem;
  background: rgba(31, 41, 55, 0.8);
  border: 1px solid #4b5563;
  border-radius: 0.375rem;
  color: #d1d5db;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 2.5rem;
  text-align: center;
}
```

### JavaScript Functionality

Added filter functionality to `squadSelection.js`:

#### Filter State Management

```javascript
// Filter state
currentFilter: "all",
searchTerm: "",
allPlayers: [],
filteredPlayers: [],
```

#### Filter Setup

```javascript
setupFilterControls() {
  // Search input
  const searchInput = document.getElementById("squadPlayerSearch");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      this.searchTerm = e.target.value;
      this.applyFiltersAndSearch();
    });
  }

  // Filter buttons
  const filterButtons = document.querySelectorAll(".squad-filter-button");
  filterButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      // Remove active class from all buttons
      filterButtons.forEach((btn) =>
        btn.classList.remove("squad-filter-button--active")
      );
      // Add active class to clicked button
      e.target.classList.add("squad-filter-button--active");

      this.currentFilter = e.target.dataset.position;
      this.applyFiltersAndSearch();
    });
  });
}
```

#### Filter Application

```javascript
applyFiltersAndSearch() {
  let filtered = [...this.allPlayers];

  // Apply position filter
  if (this.currentFilter !== "all") {
    filtered = filtered.filter(
      (player) => player.position === this.currentFilter
    );
  }

  // Apply search filter
  if (this.searchTerm.trim()) {
    const searchLower = this.searchTerm.toLowerCase();
    filtered = filtered.filter(
      (player) =>
        (player.player_name || "").toLowerCase().includes(searchLower) ||
        (player.position || "").toLowerCase().includes(searchLower)
    );
  }

  this.filteredPlayers = filtered;
  this.renderFilteredPlayers();
}
```

## Key Features

### 1. **Search Functionality**

- Real-time search as user types
- Searches both player names and positions
- Case-insensitive matching
- Clear visual feedback with search icon

### 2. **Position Filtering**

- Filter by specific positions: OH, MB, S, L, OP
- "All" option to show all players
- Visual active state for selected filter
- Abbreviated position names to save space

### 3. **Responsive Design**

- Scaled-down components to fit in available players section
- Responsive button sizing for different screen sizes
- Mobile-optimized layout
- Maintains functionality across all device sizes

### 4. **Integration with Existing Features**

- Works seamlessly with drag-and-drop functionality
- Maintains player visibility states (hidden when in squad)
- Preserves all existing squad selection features
- No conflicts with existing functionality

## Visual Design

### **Scaling Considerations**

- **Smaller buttons**: Reduced padding and font size
- **Compact layout**: Vertical arrangement to save horizontal space
- **Abbreviated labels**: OH, MB, S, L, OP instead of full position names
- **Consistent theming**: Matches the application's dark theme

### **Responsive Breakpoints**

- **Desktop**: Full-size filter controls
- **Tablet**: Slightly smaller buttons and input
- **Mobile**: Compact layout with smaller elements

## User Experience

### **Intuitive Interface**

- Clear visual hierarchy with search at top, filters below
- Immediate feedback when typing or clicking
- Smooth transitions and hover effects
- Consistent with team management page design

### **Efficient Workflow**

- Quick access to specific position players
- Real-time search for finding specific players
- No page refresh required
- Maintains squad state during filtering

## Technical Implementation

### **State Management**

- Separate filter state from main component state
- Efficient filtering using array methods
- Proper cleanup and event listener management

### **Performance**

- Debounced search input (implicit through event handling)
- Efficient DOM updates
- Minimal re-rendering of player cards
- Memory-efficient filtering

### **Error Handling**

- Graceful handling of missing elements
- Fallback for empty search results
- Proper cleanup on component destruction

## Usage

### **Search Players**

1. Type in the search input to filter by name or position
2. Results update in real-time
3. Clear search to show all players

### **Filter by Position**

1. Click on position buttons (OH, MB, S, L, OP)
2. Click "All" to show all positions
3. Active filter is highlighted in purple

### **Combine Filters**

- Use search and position filter together
- Both filters are applied simultaneously
- Clear either filter to expand results

## Future Enhancements

Potential improvements for the filter system:

1. **Advanced Filters**: Age, overall rating, contract status
2. **Sort Options**: Sort by name, rating, position
3. **Saved Filters**: Remember user's preferred filters
4. **Quick Actions**: Select all players of a position
5. **Filter Presets**: Common filter combinations

The filter integration provides a powerful yet intuitive way for users to find and select players for their squad, significantly improving the user experience of the squad selection process.

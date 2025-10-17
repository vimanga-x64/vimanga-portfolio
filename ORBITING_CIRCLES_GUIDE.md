# 🎯 Orbiting Tech Stack Guide

## ✨ What Was Created

A **pure CSS orbiting circles animation** for your tech stack section that:
- ✅ Works with vanilla HTML/CSS (no React needed!)
- ✅ Features 2 orbit rings with 10 rotating tech icons
- ✅ Has smooth hover effects with labels
- ✅ Fully responsive (smaller on tablets/mobile)
- ✅ Keeps your original text list below for accessibility

---

## 🎨 Visual Structure

```
           Center Icon (Code symbol)
                |
        ┌───────┴───────┐
        │               │
   Inner Orbit      Outer Orbit
   (4 icons)        (6 icons)
   20s duration     30s duration
   80px radius      120px radius
```

### **Inner Orbit (Languages):**
- Python
- JavaScript  
- SQL
- Java

### **Outer Orbit (Frameworks/Tools):**
- React
- PyTorch
- Docker
- GCP
- Git
- MongoDB

---

## ⚙️ Customization Guide

### **1. Change Icons**

Find the orbit items in HTML (around line 2120) and change the Phosphor icon:

```html
<!-- Example: Change Python icon -->
<div class="orbit-icon">
  <i class="ph-bold ph-file-py"></i>  <!-- Change this! -->
  <span class="orbit-icon-text">Python</span>
</div>
```

**Popular Phosphor Icons:**
- `ph-file-py` - Python
- `ph-file-js` - JavaScript
- `ph-file-java` - Java
- `ph-database` - Database/SQL
- `ph-atom` - React
- `ph-brain` - AI/ML
- `ph-cube` - Docker
- `ph-cloud` - Cloud services
- `ph-git-branch` - Git
- `ph-device-mobile` - Mobile/Flutter
- `ph-terminal` - Terminal/CLI
- `ph-chart-line` - Analytics
- `ph-shield` - Security
- `ph-cpu` - Hardware/Systems

Browse all icons: https://phosphoricons.com/

---

### **2. Add More Icons**

To add icons to inner orbit (copy this pattern):

```html
<div class="orbit-item" style="--orbit-radius: 80px; --orbit-duration: 20s; animation-delay: -5s;">
  <div class="orbit-icon">
    <i class="ph-bold ph-YOUR-ICON"></i>
    <span class="orbit-icon-text">Your Tech</span>
  </div>
</div>
```

**Adjust `animation-delay` to spread icons evenly:**
- For 4 icons: 0s, -5s, -10s, -15s
- For 5 icons: 0s, -4s, -8s, -12s, -16s
- For 6 icons: 0s, -3.3s, -6.6s, -10s, -13.3s, -16.6s

---

### **3. Change Orbit Speed**

Find the orbit items and change `--orbit-duration`:

```html
<!-- Faster rotation -->
<div class="orbit-item" style="--orbit-radius: 80px; --orbit-duration: 10s;">

<!-- Slower rotation -->
<div class="orbit-item" style="--orbit-radius: 80px; --orbit-duration: 40s;">

<!-- Stop rotation -->
<div class="orbit-item" style="--orbit-radius: 80px; --orbit-duration: 999999s;">
```

---

### **4. Change Orbit Size**

Modify `--orbit-radius`:

```html
<!-- Smaller inner orbit -->
<div class="orbit-item" style="--orbit-radius: 60px; --orbit-duration: 20s;">

<!-- Larger outer orbit -->
<div class="orbit-item" style="--orbit-radius: 150px; --orbit-duration: 30s;">
```

**In CSS (line ~1347), also update the visible rings:**
```css
.orbit-ring-1 { width: 120px; height: 120px; }  /* 2 × 60px */
.orbit-ring-2 { width: 300px; height: 300px; }  /* 2 × 150px */
```

---

### **5. Change Center Icon**

Find the center icon (around line 2114):

```html
<div class="orbit-center">
  <i class="ph-bold ph-code"></i>  <!-- Change this! -->
</div>
```

**Suggestions:**
- `ph-code` - Code symbol (current)
- `ph-user` - Your profile
- `ph-star` - Achievement
- `ph-lightning` - Energy/power
- `ph-rocket` - Progress
- `ph-gear` - Settings/tools
- Text: Replace `<i>` with your initials: `<span>VU</span>`

---

### **6. Change Colors**

In CSS (around line 1336):

```css
.orbit-center {
  background: linear-gradient(135deg, var(--accent), #60A5FA);
  /* Change to any gradient you like */
}

.orbit-icon {
  border: 2px solid var(--accent);
  /* Change border color */
}

.orbit-icon i {
  color: var(--accent);
  /* Change icon color */
}

.orbit-ring {
  border: 1px solid rgba(59, 130, 246, 0.2);
  /* Change ring color */
}
```

**Color suggestions:**
```css
/* Purple theme */
background: linear-gradient(135deg, #9333EA, #A855F7);
border: 2px solid #9333EA;
color: #9333EA;

/* Cyan theme */
background: linear-gradient(135deg, #00CED1, #06B6D4);
border: 2px solid #00CED1;
color: #00CED1;

/* Green theme */
background: linear-gradient(135deg, #10B981, #34D399);
border: 2px solid #10B981;
color: #10B981;
```

---

### **7. Reverse Orbit Direction**

To make orbits spin the opposite way, change the animation:

```css
/* Find this at line ~1391 */
@keyframes orbit {
  from { transform: rotate(0deg) translateX(var(--orbit-radius)) rotate(0deg); }
  to { transform: rotate(-360deg) translateX(var(--orbit-radius)) rotate(360deg); }
  /* Changed 360deg to -360deg */
}
```

Or add a reverse class:

```css
@keyframes orbit-reverse {
  from { transform: rotate(0deg) translateX(var(--orbit-radius)) rotate(0deg); }
  to { transform: rotate(-360deg) translateX(var(--orbit-radius)) rotate(360deg); }
}

.orbit-item-reverse {
  animation: orbit-reverse var(--orbit-duration) linear infinite;
}
```

---

### **8. Add Third Orbit Ring**

1. **Add the ring visual** (around line 2111):
```html
<div class="orbit-ring orbit-ring-3"></div>
```

2. **Add CSS for the ring** (around line 1347):
```css
.orbit-ring-3 { width: 300px; height: 300px; }
```

3. **Add icons on the new orbit**:
```html
<div class="orbit-item" style="--orbit-radius: 150px; --orbit-duration: 40s; animation-delay: 0s;">
  <div class="orbit-icon">
    <i class="ph-bold ph-flask"></i>
    <span class="orbit-icon-text">Flask</span>
  </div>
</div>
```

---

### **9. Change Icon Sizes**

In CSS (around line 1356):

```css
.orbit-icon {
  width: 50px;    /* Change both to same value */
  height: 50px;
  font-size: 1.5rem;  /* Icon size inside */
}

.orbit-center {
  width: 80px;    /* Change both to same value */
  height: 80px;
  font-size: 2rem;  /* Center icon size */
}
```

---

### **10. Disable Hover Effects**

If you want static icons without hover:

```css
.orbit-icon:hover {
  /* Comment out or remove these lines */
  /* transform: scale(1.2); */
  /* box-shadow: 0 8px 25px rgba(59, 130, 246, 0.5); */
  /* border-color: #60A5FA; */
}

.orbit-icon-text {
  /* To always show labels */
  opacity: 1;
}
```

---

## 📱 Mobile Responsiveness

The orbit automatically scales down on smaller screens:

- **Desktop (>1024px):** 300px × 300px
- **Tablet (768-1024px):** 250px × 250px  
- **Mobile (<768px):** 200px × 200px

Icons also scale proportionally.

---

## 🎨 Preset Configurations

### **Minimal (Fewer Icons)**
Keep only 6 icons total (3 inner, 3 outer) for cleaner look.

### **Showcase (More Icons)**
Add 3rd orbit ring with 8 more icons (18 total).

### **Static Display**
Set all durations to `999999s` for frozen positions.

### **Fast Spin**
Set durations to `10s` and `15s` for energetic feel.

### **Opposite Directions**
Make inner orbit clockwise, outer counter-clockwise using reverse animation.

---

## 🎯 Pro Tips

1. **Keep icon count divisible:** 4, 6, or 8 icons per orbit for even spacing
2. **Stagger delays evenly:** Divide duration by icon count
3. **Test on mobile:** Make sure icons don't overlap
4. **Use semantic icons:** Match icon to technology
5. **Maintain contrast:** Ensure icons are visible in both themes

---

## 🐛 Troubleshooting

### **Icons not orbiting?**
- Check animation is running (browser DevTools → Elements → Computed → animation)
- Verify `--orbit-radius` and `--orbit-duration` CSS variables are set

### **Icons overlapping?**
- Reduce icon count OR increase orbit radius
- Adjust `animation-delay` values

### **Center icon off-center?**
- Verify orbit-container has `display: flex` and `align-items: center`

### **Rings not showing?**
- Check border color isn't too transparent
- Increase border width to `2px`

### **Performance issues?**
- Reduce icon count
- Increase duration (slower = less CPU)
- Remove blur effects

---

## 🔄 Alternative: Single Orbit

Want just one orbit ring instead of two?

1. Keep only the inner or outer orbit items
2. Remove unused ring div
3. Adjust icon count to 8-10 for fullness

---

## 🚀 What You Have Now

✅ **Interactive tech stack** that stands out
✅ **No React/build tools** - pure CSS magic
✅ **Hover interactions** with tech labels
✅ **Fully responsive** on all devices
✅ **Accessibility preserved** with text list below
✅ **Professional animation** that's smooth and performant

Your tech stack section is now a visual centerpiece! 🎉

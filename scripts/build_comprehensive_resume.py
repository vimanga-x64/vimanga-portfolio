from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    HRFlowable,
    KeepTogether,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "pdf" / "Vimanga_Umange_Resume.pdf"
OUTPUT.parent.mkdir(parents=True, exist_ok=True)

INK = colors.HexColor("#111412")
MUTED = colors.HexColor("#555b56")
ACCENT = colors.HexColor("#526329")
LINE = colors.HexColor("#b9bdb8")

styles = getSampleStyleSheet()
name_style = ParagraphStyle(
    "Name", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=19,
    leading=21, alignment=TA_CENTER, textColor=INK, spaceAfter=2,
)
contact_style = ParagraphStyle(
    "Contact", parent=styles["Normal"], fontName="Helvetica", fontSize=8.2,
    leading=10, alignment=TA_CENTER, textColor=MUTED, spaceAfter=10,
)
summary_style = ParagraphStyle(
    "Summary", parent=styles["Normal"], fontName="Helvetica", fontSize=8.7,
    leading=11.5, textColor=INK, spaceAfter=8,
)
section_style = ParagraphStyle(
    "Section", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=10.2,
    leading=12, textColor=INK, spaceBefore=7, spaceAfter=2,
)
title_style = ParagraphStyle(
    "Title", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=9.1,
    leading=11, textColor=INK,
)
meta_style = ParagraphStyle(
    "Meta", parent=styles["Normal"], fontName="Helvetica-Oblique", fontSize=7.8,
    leading=9.5, textColor=MUTED,
)
body_style = ParagraphStyle(
    "Body", parent=styles["Normal"], fontName="Helvetica", fontSize=8.1,
    leading=10.6, textColor=INK,
)
bullet_style = ParagraphStyle(
    "Bullet", parent=body_style, leftIndent=12, firstLineIndent=-8,
    bulletIndent=0, spaceBefore=1.2, spaceAfter=0,
)
skill_label_style = ParagraphStyle(
    "SkillLabel", parent=body_style, fontName="Helvetica-Bold", textColor=INK,
)
footer_style = ParagraphStyle(
    "Footer", parent=styles["Normal"], fontName="Helvetica", fontSize=7,
    leading=8, textColor=MUTED, alignment=TA_RIGHT,
)


def section(title):
    return KeepTogether([
        Spacer(1, 2),
        Paragraph(title.upper(), section_style),
        HRFlowable(width="100%", thickness=0.55, color=INK, spaceAfter=4),
    ])


def role(title, organization, dates, location, bullets):
    heading = Table(
        [[Paragraph(f"{title} | {organization}", title_style), Paragraph(location, meta_style)],
         [Paragraph(dates, meta_style), ""]],
        colWidths=[6.1 * inch, 1.05 * inch],
        hAlign="LEFT",
    )
    heading.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ALIGN", (1, 0), (1, 0), "RIGHT"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    items = [heading]
    items.extend(Paragraph(f"- {bullet}", bullet_style) for bullet in bullets)
    items.append(Spacer(1, 5))
    return KeepTogether(items)


def project(title, subtitle, bullets):
    items = [Paragraph(title, title_style), Paragraph(subtitle, meta_style)]
    items.extend(Paragraph(f"- {bullet}", bullet_style) for bullet in bullets)
    items.append(Spacer(1, 5))
    return KeepTogether(items)


def skill_row(label, value):
    table = Table(
        [[Paragraph(label, skill_label_style), Paragraph(value, body_style)]],
        colWidths=[1.42 * inch, 5.73 * inch],
        hAlign="LEFT",
    )
    table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 1),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
    ]))
    return table


def draw_page(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.4)
    canvas.line(doc.leftMargin, 0.42 * inch, letter[0] - doc.rightMargin, 0.42 * inch)
    canvas.setFont("Helvetica", 7)
    canvas.setFillColor(MUTED)
    canvas.drawString(doc.leftMargin, 0.27 * inch, "VIMANGA UMANGE - COMPREHENSIVE RESUME")
    canvas.drawRightString(letter[0] - doc.rightMargin, 0.27 * inch, f"PAGE {doc.page}")
    canvas.restoreState()


doc = BaseDocTemplate(
    str(OUTPUT), pagesize=letter,
    leftMargin=0.58 * inch, rightMargin=0.58 * inch,
    topMargin=0.46 * inch, bottomMargin=0.54 * inch,
    title="Vimanga Umange - Comprehensive Resume",
    author="Vimanga Umange",
)
frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="resume")
doc.addPageTemplates(PageTemplate(id="resume", frames=[frame], onPage=draw_page))

story = [
    Paragraph("VIMANGA UMANGE", name_style),
    Paragraph(
        "Windsor, ON | 519-816-9683 | vimangau@gmail.com | "
        "linkedin.com/in/vimanga-umange | github.com/vimanga-x64",
        contact_style,
    ),
    Paragraph(
        "Computer Science M.Sc. candidate specializing in artificial intelligence, with professional experience "
        "spanning software engineering, applied machine learning, enterprise IT infrastructure, technical support, "
        "and computer-network instruction. Builds practical systems that connect research, data, and reliable operations.",
        summary_style,
    ),
    section("Professional Experience"),
    role(
        "Graduate Assistant - Computer Networks", "University of Windsor",
        "May 2025 - Present", "Windsor, ON",
        [
            "Support course delivery through grading, lab sessions, tutorials, and office hours for more than 100 students.",
            "Teach TCP/IP, routing protocols, network security, Wireshark traffic analysis, and Cisco Packet Tracer labs.",
        ],
    ),
    role(
        "Information Technology Specialist", "Etezazi Industries",
        "September 2021 - September 2024", "Wichita, KS",
        [
            "Administered Active Directory, Group Policy, DNS, DHCP, Windows Server, Hyper-V, VPN, firewall, and core network services.",
            "Configured SQL, PBX, SharePoint, Terminal Services, File/Print, and Active Directory servers.",
            "Managed Microsoft 365 and Exchange Online users, licensing, mailboxes, aliases, groups, Teams channels, and mail flow.",
            "Migrated more than 100 user accounts to a new Active Directory domain with zero operational downtime.",
            "Configured SSL VPN access and SonicWall policies while supporting CMMC and ITAR-aligned systems and data practices.",
            "Designed and maintained the company website using WordPress, HTML, and CSS.",
        ],
    ),
    role(
        "Information Technology Intern", "Etezazi Industries",
        "July 2021 - September 2021", "Wichita, KS",
        [
            "Automated inventory workflows with Python, reducing scrap parts by 40 percent.",
            "Resolved more than 200 Zendesk support requests while meeting service-level expectations.",
            "Developed SQL queries for operational reporting and deployed workstations, software, hardware, and peripherals.",
        ],
    ),
    role(
        "Software Engineering Intern", "Arimac Digital",
        "June 2017 - August 2017", "Colombo, Sri Lanka",
        [
            "Contributed to end-to-end software development and translated product-owner use cases into tested features.",
            "Optimized application architecture to improve data-log retrieval speed by up to 60 percent.",
        ],
    ),
    section("Research"),
    project(
        "Hybrid POMDP for Mobile ITS with Co-optimized Pedagogical Effectiveness and Mobile Performance",
        "Master's thesis | University of Windsor | Manuscript forthcoming",
        [
            "Formulated mobile avatar-based tutoring as a hybrid POMDP and trained a Deep Q-Network to jointly control pedagogy, compute placement, and interface fidelity.",
            "Modeled student mastery, engagement, affect, device telemetry, and local-edge-cloud execution within one multi-objective policy.",
            "Achieved a 44 percent relative improvement in normalized learning gain and reduced average per-step latency by 498.5 ms versus the pedagogy-only baseline.",
            "Satisfied a strict 500 ms real-time threshold across 98.68 percent of simulated tutoring steps.",
        ],
    ),
    project(
        "Top-k Densest Subgraph Augmentation for Hypergraph Neural Networks",
        "Research project | April 2025 | Co-author",
        [
            "Implemented augmentation strategies across synthetic and real-world datasets.",
            "Improved movie-profitability prediction accuracy by 4.0 percent through model comparison and evaluation.",
        ],
    ),
    project(
        "Automated Glossing for Low-Resource Languages",
        "Research project | March 2025 | Co-author",
        [
            "Developed a transformer-based framework for interlinear gloss generation in morphologically complex languages including Ancient Greek and Arapaho.",
        ],
    ),
    project(
        "Online News Popularity Model Comparison",
        "Machine learning study",
        [
            "Evaluated nine regression models on more than 39,000 records using cross-validation and hyperparameter tuning.",
            "Applied target transformation and feature scaling; Gradient Boosting and Random Forest produced the strongest results.",
        ],
    ),
    section("Selected Projects"),
    project(
        "NASA Weather Activity Recommender - NASA Space Apps Challenge Honorable Mention",
        "NASA APIs | Statistical forecasting | Machine learning | LLM",
        [
            "Built WeatherWise, a recommendation engine combining NASA satellite data with weather forecasts to evaluate outdoor activity risk.",
            "Integrated multiple NASA APIs with normalization, error handling, caching, and real-time visualization.",
            "Designed risk ratings, explanations, and alternative scheduling recommendations for activities such as hiking, running, surfing, and kayaking.",
        ],
    ),
    project(
        "AI-Powered Movie Search",
        "React | Hugging Face Transformers | TMDB | NLP",
        [
            "Built a responsive semantic-search application that interprets natural-language intent and retrieves relevant TMDB entities.",
            "Improved result quality with query expansion, resilient API fallbacks, animated cards, and dark/light themes.",
        ],
    ),
    project(
        "Free Game Scraper",
        "Flask | REST APIs | Firebase | ETL",
        [
            "Designed and deployed a full-stack aggregator covering more than six PC and console game platforms.",
            "Built modular Flask scrapers, TTL caching, fallback data, protected APIs, and Firebase authentication and account storage.",
            "Optimized image loading, search responsiveness, accessibility, and deployment across Render and GitHub Pages.",
        ],
    ),
    project(
        "WSU GO - Senior Capstone Team Lead",
        "Flutter | Dart | OpenWeather API",
        [
            "Led a four-person team developing a cross-platform student-management prototype within four months.",
            "Designed and implemented a weather feature using real-time and forecast data from OpenWeather.",
        ],
    ),
    section("Education"),
    role(
        "Master of Science in Computer Science", "University of Windsor",
        "Expected October 2026 | Specialization: Artificial Intelligence", "Windsor, ON", [],
    ),
    role(
        "Bachelor of Science in Computer Science", "Wichita State University",
        "January 2016 - July 2021", "Wichita, KS", [],
    ),
    section("Core Competencies and Skills"),
    skill_row("Programming", "Python, JavaScript, Java, C++, C#, SQL, Dart, PHP"),
    skill_row("Product engineering", "React, Flask, REST APIs, HTML/CSS, Flutter, .NET, WordPress"),
    skill_row("AI and data", "PyTorch, TensorFlow, Hugging Face Transformers, Scikit-learn, Pandas, NumPy, predictive modeling, ETL, Power BI, Matplotlib, Seaborn"),
    skill_row("Systems", "Windows Server, Active Directory, Group Policy, Hyper-V, Microsoft 365, Exchange Online, SharePoint, Terminal Services, File/Print Services"),
    skill_row("Networking and security", "TCP/IP, DNS, DHCP, SSL VPN, SonicWall, Ubiquiti, Wireshark, CMMC, ITAR"),
    skill_row("IT operations", "PowerShell, NinjaOne RMM, Zendesk, SLA support, workstation deployment, backup and disaster recovery"),
    skill_row("Data and platforms", "PostgreSQL, Google Cloud, Firebase, Render, GitHub Pages, Jupyter, Git, VS Code, Linux"),
    skill_row("Languages", "English (fluent), Sinhala (fluent)"),
]

doc.build(story)
print(OUTPUT)

# Vector Research Papers - Admin User Guide

## Table of Contents
- [Getting Started](#getting-started)
- [Logging In](#logging-in)
- [Dashboard Overview](#dashboard-overview)
- [Managing Papers](#managing-papers)
- [Writing Papers](#writing-papers)
- [Publishing Workflow](#publishing-workflow)
- [Search and Organization](#search-and-organization)
- [Settings and Configuration](#settings-and-configuration)
- [Troubleshooting](#troubleshooting)

## Getting Started

Welcome to the Vector Research Papers Platform admin interface. This guide will help you manage research papers, organize content, and maintain your research repository.

### First Time Setup
1. Navigate to your domain's admin login page: `https://your-domain.com/admin/login`
2. Use the admin credentials provided during deployment
3. Change your password immediately after first login
4. Familiarize yourself with the dashboard layout

## Logging In

### Admin Login Process
1. **Access Admin Panel**: Go to `/admin/login`
2. **Enter Credentials**: Use your admin username and password
3. **Dashboard Redirect**: Successfully login redirects to the admin dashboard
4. **Session Management**: Your session persists across browser tabs and page reloads

### Security Best Practices
- Use a strong, unique password (minimum 12 characters)
- Log out when finished, especially on shared computers
- Don't share admin credentials with unauthorized users
- Monitor login attempts in the logs

## Dashboard Overview

The admin dashboard provides a comprehensive overview of your research papers platform:

### Statistics Cards
- **Total Papers**: Count of all papers in the system
- **Public Papers**: Number of papers visible to the public
- **Total Views**: Aggregate view count across all papers
- **Recent Activity**: Latest papers and modifications

### Quick Actions
- **New Paper**: Create a new research paper
- **Manage Papers**: Access the papers management interface
- **View Analytics**: See detailed usage statistics (if enabled)
- **Settings**: Configure platform settings

### Recent Papers
- Display of the 5 most recently created or modified papers
- Quick links to edit or view each paper
- Status indicators (draft, published, private)

## Managing Papers

### Papers List Interface
Navigate to `Admin → Papers` to access the papers management interface:

#### List View Features
- **Search**: Find papers by title, author, or keywords
- **Filter**: Filter by publication status (all, public, private, draft)
- **Sort**: Sort by creation date, modification date, or title
- **Bulk Actions**: Select multiple papers for bulk operations

#### Paper Status Indicators
- **📄 Draft**: Paper saved but not published
- **🌐 Public**: Paper visible to all users
- **🔒 Private**: Paper accessible only to admins
- **📝 Unlisted**: Paper accessible via direct link only

### Individual Paper Actions
For each paper in the list, you can:

#### View Paper
- Click the paper title to view it as users would see it
- Check formatting, layout, and content presentation
- Verify all metadata is displaying correctly

#### Edit Paper
- Click "Edit" to open the paper in the editor
- Modify content, metadata, or publication settings
- Save changes or publish immediately

#### Delete Paper
- Click "Delete" to permanently remove a paper
- Confirmation dialog prevents accidental deletion
- **Warning**: This action cannot be undone

#### Change Visibility
- Toggle between public, private, and unlisted status
- Public papers appear in navigation and search
- Private papers are admin-only
- Unlisted papers are accessible via direct link

## Writing Papers

### Paper Editor Interface
The paper editor provides a rich environment for creating research papers:

#### Metadata Section
- **Title**: Paper title (required, appears in navigation)
- **Authors**: Author names, separated by commas
- **Keywords**: Tags for categorization and search
- **Abstract**: Brief paper summary (optional but recommended)

#### Content Editor
- **Markdown Support**: Full markdown formatting support
- **Live Preview**: Real-time preview of formatted content
- **Math Equations**: LaTeX/KaTeX support for mathematical expressions
- **Code Blocks**: Syntax highlighting for code samples
- **Images**: Support for embedded images

#### Editor Features
- **Auto-save**: Automatically saves drafts every 30 seconds
- **Version History**: Access previous versions of your paper
- **Full-screen Mode**: Distraction-free writing environment
- **Word Count**: Real-time word and character count

### Markdown Formatting Guide

#### Basic Formatting
```markdown
# Main Title
## Section Title
### Subsection Title

**Bold text**
*Italic text*
`Inline code`

- Bullet point list
1. Numbered list item
2. Another numbered item
```

#### Academic Writing Features
```markdown
## Citations and References
Reference papers like this [1] or (Smith et al., 2023).

## Mathematical Expressions
Inline math: $E = mc^2$

Block math:
$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$

## Code Blocks with Syntax Highlighting
\`\`\`python
def calculate_vector_similarity(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))
\`\`\`

## Tables
| Method | Accuracy | Performance |
|--------|----------|-------------|
| SVM    | 0.95     | Fast        |
| Neural | 0.98     | Slow        |
```

#### Images and Figures
```markdown
![Figure 1: Architecture Diagram](path/to/image.png)

*Figure 1: System architecture showing the main components*
```

## Publishing Workflow

### Paper Lifecycle
1. **Draft**: Initial creation and editing phase
2. **Review**: Internal review and refinement
3. **Publish**: Make paper publicly available
4. **Update**: Modify published papers as needed

### Publication Process
1. **Complete Content**: Ensure all sections are written
2. **Review Metadata**: Verify title, authors, keywords, abstract
3. **Preview**: Use preview mode to check formatting
4. **Set Visibility**: Choose public, private, or unlisted
5. **Publish**: Click "Publish" to make paper live

### Post-Publication
- Published papers appear in public navigation
- Papers are indexed for search functionality
- View statistics become available
- Social media sharing is enabled (if configured)

### Updating Published Papers
- Edit published papers anytime
- Changes are immediately visible to users
- Consider adding update notes for significant changes
- Last modified date updates automatically

## Search and Organization

### Paper Search Features
- **Full-text Search**: Search across all paper content
- **Metadata Search**: Search titles, authors, keywords
- **Advanced Filters**: Filter by date, author, publication status
- **Search History**: Recent searches are saved

### Organizational Tools

#### Keywords and Tagging
- Use consistent keywords for better organization
- Create a keyword taxonomy for your research area
- Keywords improve search functionality
- Tags help users discover related papers

#### Categories (Future Feature)
- Hierarchical categorization system
- Multiple category assignment per paper
- Category-based navigation for users

## Settings and Configuration

### Admin Settings
Access via `Admin → Settings`:

#### User Management
- Change admin password
- View login history
- Configure session timeout
- Set up two-factor authentication (if available)

#### Platform Settings
- Site title and description
- Contact information
- Footer content and links
- Social media integration

#### Publication Settings
- Default paper visibility
- Automatic publishing rules
- Content validation settings
- Backup and export options

### SEO and Visibility
- Each paper has unique meta tags
- Automatic sitemap generation
- Social media preview optimization
- Search engine indexing configuration

## Troubleshooting

### Common Issues and Solutions

#### Login Problems
**Issue**: Cannot log in with admin credentials
- Verify username and password are correct
- Check for caps lock or special characters
- Clear browser cache and cookies
- Contact system administrator if problem persists

#### Editor Issues
**Issue**: Paper editor is not loading
- Refresh the page
- Disable browser extensions temporarily
- Check browser console for JavaScript errors
- Try using a different browser

#### Publishing Problems
**Issue**: Paper doesn't appear after publishing
- Verify paper status is set to "Public"
- Check that all required fields are completed
- Refresh the public site
- Review server logs if problems continue

#### Formatting Issues
**Issue**: Markdown not rendering correctly
- Check markdown syntax for errors
- Verify image paths are correct
- Test mathematical expressions syntax
- Use the preview mode to identify issues

#### Performance Issues
**Issue**: Editor or dashboard loading slowly
- Check internet connection
- Clear browser cache
- Close unnecessary browser tabs
- Monitor server resource usage

### Getting Help
1. **Documentation**: Review this guide and other documentation
2. **Error Messages**: Note exact error messages for troubleshooting
3. **Browser Console**: Check for JavaScript errors
4. **Server Logs**: Review application logs for errors
5. **System Administrator**: Contact technical support if needed

## Advanced Features

### Bulk Operations
- Select multiple papers for bulk actions
- Change visibility of multiple papers
- Export multiple papers to various formats
- Delete multiple papers (use with caution)

### Import and Export
- Export papers to various formats (PDF, HTML, etc.)
- Import papers from other platforms
- Backup all content regularly
- Migrate between different installations

### API Integration
- REST API available for programmatic access
- API documentation available at `/api/docs`
- Authentication required for admin operations
- Rate limiting applies to API requests

## Best Practices

### Content Management
- Write clear, descriptive titles
- Use consistent keyword taxonomy
- Include comprehensive abstracts
- Maintain consistent formatting style

### SEO Optimization
- Use descriptive paper titles
- Include relevant keywords naturally
- Write compelling abstracts
- Optimize images with alt text

### Security
- Use strong, unique passwords
- Log out when finished
- Monitor access logs regularly
- Keep admin access restricted

### Backup and Recovery
- Regular backups are automated
- Test restore procedures periodically
- Keep local copies of important papers
- Document your content organization system

## Keyboard Shortcuts

### Editor Shortcuts
- `Ctrl/Cmd + S`: Save draft
- `Ctrl/Cmd + Enter`: Publish paper
- `Ctrl/Cmd + B`: Bold text
- `Ctrl/Cmd + I`: Italic text
- `Ctrl/Cmd + K`: Insert link
- `F11`: Toggle full-screen mode

### Navigation Shortcuts
- `Alt + H`: Go to dashboard
- `Alt + P`: Go to papers list
- `Alt + N`: Create new paper
- `Alt + L`: Logout

---

For technical support or system administration questions, refer to the deployment documentation or contact your system administrator.
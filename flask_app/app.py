from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, session
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import sqlite3
import csv
import os
from datetime import datetime, date
import json
from functools import wraps

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-change-this-in-production'
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Flask-Login setup
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

# Database setup
DATABASE = 'rvc_schedule.db'

def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with get_db() as conn:
        conn.executescript('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                school_name TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'AD',
                full_name TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE TABLE IF NOT EXISTS games (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                school_id INTEGER NOT NULL,
                sport TEXT NOT NULL,
                season TEXT NOT NULL,
                date TEXT NOT NULL,
                time TEXT,
                opponent TEXT NOT NULL,
                location TEXT,
                home_away TEXT NOT NULL,
                result TEXT,
                notes TEXT,
                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (school_id) REFERENCES users (id)
            );
            
            CREATE TABLE IF NOT EXISTS schedule_uploads (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                school_id INTEGER NOT NULL,
                sport TEXT NOT NULL,
                season TEXT NOT NULL,
                filename TEXT NOT NULL,
                upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (school_id) REFERENCES users (id)
            );
            
            CREATE TABLE IF NOT EXISTS press_releases (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                author_id INTEGER NOT NULL,
                author_name TEXT NOT NULL,
                school_name TEXT NOT NULL,
                attachment_filename TEXT,
                attachment_path TEXT,
                published BOOLEAN DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (author_id) REFERENCES users (id)
            );
        ''')
        
        # Insert initial AD and Principal users for each school
        users_data = [
            # Athletic Directors
            ('Brandon.DuBois@beecher200u.org', 'Beecher', 'AD', 'Brandon DuBois'),
            ('DJ.Harris@cusd4.org', 'Central', 'AD', 'DJ Harris'),
            ('Kim.Onnen@donovanschools.org', 'Donovan', 'AD', 'Kim Onnen'),
            ('Amber.Eisha@gswhs73.org', 'Gardner South Wilmington', 'AD', 'Amber Eisha'),
            ('Jon.Chappell@gracecrusaders.org', 'Grace Christian Academy', 'AD', 'Jon Chappell'),
            ('Jared.Thompson@grantparkdragons.org', 'Grant Park', 'AD', 'Jared Thompson'),
            ('Nathan.Hinz@ilhs.org', 'Illinois Lutheran', 'AD', 'Nathan Hinz'),
            ('Ted.Rounds@momence.k12.il.us', 'Momence', 'AD', 'Ted Rounds'),
            ('Zach.Kirkland@stanne24.org', 'St. Anne', 'AD', 'Zach Kirkland'),
            ('Alison.Buckley@tripointschools.org', 'Tri Point', 'AD', 'Alison Buckley'),
            # Principals
            ('Mike.Meyer@beecher200u.org', 'Beecher', 'Principal', 'Mike Meyer'),
            ('Marc.Shaner@cusd4.org', 'Central', 'Principal', 'Marc Shaner'),
            ('Justin.Benda@donovanschools.org', 'Donovan', 'Principal', 'Justin Benda'),
            ('Brian.Davis@gswhs73.org', 'Gardner South Wilmington', 'Principal', 'Brian Davis'),
            ('Aaron.Most@gracecrusaders.org', 'Grace Christian Academy', 'Principal', 'Aaron Most'),
            ('Kyle.Nevills@grantparkdragons.org', 'Grant Park', 'Principal', 'Kyle Nevills'),
            ('Matt.Moeller@ilhs.org', 'Illinois Lutheran', 'Principal', 'Matt Moeller'),
            ('Jack.Richards@momence.k12.il.us', 'Momence', 'Principal', 'Jack Richards'),
            ('Ben.OBrien@stanne24.org', 'St. Anne', 'Principal', 'Ben O\'Brien'),
            ('Alison.Buckley.P@tripointschools.org', 'Tri Point', 'Principal', 'Alison Buckley'),
        ]
        
        for email, school, role, full_name in users_data:
            try:
                # Default password is 'password' - users should change this
                default_password = generate_password_hash('password')
                conn.execute(
                    'INSERT OR IGNORE INTO users (email, password_hash, school_name, role, full_name) VALUES (?, ?, ?, ?, ?)',
                    (email, default_password, school, role, full_name)
                )
            except sqlite3.IntegrityError:
                pass  # User already exists

class User(UserMixin):
    def __init__(self, id, email, school_name, role, full_name):
        self.id = id
        self.email = email
        self.school_name = school_name
        self.role = role
        self.full_name = full_name

@login_manager.user_loader
def load_user(user_id):
    with get_db() as conn:
        user = conn.execute('SELECT * FROM users WHERE id = ?', (user_id,)).fetchone()
        if user:
            return User(user['id'], user['email'], user['school_name'], user['role'], user['full_name'])
    return None

def ad_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated or current_user.role != 'AD':
            flash('Access denied. Athletic Directors only.', 'danger')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

def staff_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated or current_user.role not in ['AD', 'Principal']:
            flash('Access denied. School staff only.', 'danger')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        
        with get_db() as conn:
            user = conn.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()
            
            if user and check_password_hash(user['password_hash'], password):
                user_obj = User(user['id'], user['email'], user['school_name'], user['role'], user['full_name'])
                login_user(user_obj)
                flash(f'Welcome, {user["full_name"]} ({user["role"]})!', 'success')
                return redirect(url_for('dashboard'))
            else:
                flash('Invalid email or password', 'danger')
    
    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('You have been logged out', 'info')
    return redirect(url_for('index'))

@app.route('/dashboard')
@login_required
@ad_required
def dashboard():
    with get_db() as conn:
        # Get recent uploads
        uploads = conn.execute('''
            SELECT * FROM schedule_uploads 
            WHERE school_id = ? 
            ORDER BY upload_date DESC 
            LIMIT 10
        ''', (current_user.id,)).fetchall()
        
        # Get upcoming games
        upcoming_games = conn.execute('''
            SELECT * FROM games 
            WHERE school_id = ? AND date >= date('now')
            ORDER BY date ASC, time ASC
            LIMIT 10
        ''', (current_user.id,)).fetchall()
    
    return render_template('dashboard.html', uploads=uploads, upcoming_games=upcoming_games)

@app.route('/upload', methods=['GET', 'POST'])
@login_required
@ad_required
def upload_schedule():
    if request.method == 'POST':
        sport = request.form['sport']
        season = request.form['season']
        
        if 'file' not in request.files:
            flash('No file selected', 'danger')
            return redirect(request.url)
        
        file = request.files['file']
        if file.filename == '':
            flash('No file selected', 'danger')
            return redirect(request.url)
        
        if file and file.filename.endswith('.csv'):
            filename = secure_filename(file.filename)
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)
            
            # Process CSV file
            try:
                with open(file_path, 'r', newline='', encoding='utf-8') as csvfile:
                    reader = csv.DictReader(csvfile)
                    
                    with get_db() as conn:
                        # Clear existing games for this school/sport/season
                        conn.execute('''
                            DELETE FROM games 
                            WHERE school_id = ? AND sport = ? AND season = ?
                        ''', (current_user.id, sport, season))
                        
                        games_added = 0
                        for row in reader:
                            # Expected CSV columns: date, time, opponent, location, home_away
                            try:
                                conn.execute('''
                                    INSERT INTO games (school_id, sport, season, date, time, opponent, location, home_away)
                                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                                ''', (
                                    current_user.id,
                                    sport,
                                    season,
                                    row.get('date', ''),
                                    row.get('time', ''),
                                    row.get('opponent', ''),
                                    row.get('location', ''),
                                    row.get('home_away', 'Home')
                                ))
                                games_added += 1
                            except Exception as e:
                                print(f"Error processing row: {e}")
                                continue
                        
                        # Record the upload
                        conn.execute('''
                            INSERT INTO schedule_uploads (school_id, sport, season, filename)
                            VALUES (?, ?, ?, ?)
                        ''', (current_user.id, sport, season, filename))
                        
                        flash(f'Successfully uploaded {games_added} games for {sport} ({season})', 'success')
                        
            except Exception as e:
                flash(f'Error processing file: {str(e)}', 'danger')
            finally:
                # Clean up uploaded file
                if os.path.exists(file_path):
                    os.remove(file_path)
        else:
            flash('Please upload a CSV file', 'danger')
    
    sports = [
        'Volleyball', 'Soccer', 'Girls Basketball', 'Boys Basketball',
        'Baseball', 'Softball', 'Track', 'Scholastic Bowl', 'Math Competition'
    ]
    seasons = ['Fall', 'Winter', 'Spring']
    
    return render_template('upload.html', sports=sports, seasons=seasons)

@app.route('/schedule')
def public_schedule():
    sport_filter = request.args.get('sport', '')
    school_filter = request.args.get('school', '')
    date_filter = request.args.get('date', '')
    
    with get_db() as conn:
        query = '''
            SELECT g.*, u.school_name 
            FROM games g 
            JOIN users u ON g.school_id = u.id 
            WHERE g.date >= date('now')
        '''
        params = []
        
        if sport_filter:
            query += ' AND g.sport = ?'
            params.append(sport_filter)
        
        if school_filter:
            query += ' AND u.school_name = ?'
            params.append(school_filter)
        
        if date_filter:
            query += ' AND g.date = ?'
            params.append(date_filter)
        
        query += ' ORDER BY g.date ASC, g.time ASC'
        
        games = conn.execute(query, params).fetchall()
        
        # Get all schools and sports for filters
        schools = conn.execute('SELECT DISTINCT school_name FROM users WHERE role = "AD"').fetchall()
        sports = conn.execute('SELECT DISTINCT sport FROM games').fetchall()
    
    return render_template('schedule.html', games=games, schools=schools, sports=sports,
                         sport_filter=sport_filter, school_filter=school_filter, date_filter=date_filter)

@app.route('/api/games')
def api_games():
    sport_filter = request.args.get('sport', '')
    school_filter = request.args.get('school', '')
    date_filter = request.args.get('date', '')
    
    with get_db() as conn:
        query = '''
            SELECT g.*, u.school_name 
            FROM games g 
            JOIN users u ON g.school_id = u.id 
            WHERE g.date >= date('now')
        '''
        params = []
        
        if sport_filter:
            query += ' AND g.sport = ?'
            params.append(sport_filter)
        
        if school_filter:
            query += ' AND u.school_name = ?'
            params.append(school_filter)
        
        if date_filter:
            query += ' AND g.date = ?'
            params.append(date_filter)
        
        query += ' ORDER BY g.date ASC, g.time ASC'
        
        games = conn.execute(query, params).fetchall()
        
        return jsonify([dict(game) for game in games])

@app.route('/press_releases')
def press_releases():
    with get_db() as conn:
        releases = conn.execute('''
            SELECT * FROM press_releases 
            WHERE published = 1 
            ORDER BY created_at DESC
        ''').fetchall()
    
    return render_template('press_releases.html', releases=releases)

@app.route('/press_releases/<int:id>')
def press_release_detail(id):
    with get_db() as conn:
        release = conn.execute('''
            SELECT * FROM press_releases 
            WHERE id = ? AND published = 1
        ''', (id,)).fetchone()
        
        if not release:
            flash('Press release not found', 'danger')
            return redirect(url_for('press_releases'))
    
    return render_template('press_release_detail.html', release=release)

@app.route('/create_press_release', methods=['GET', 'POST'])
@login_required
@staff_required
def create_press_release():
    if request.method == 'POST':
        title = request.form['title']
        content = request.form['content']
        
        attachment_filename = None
        attachment_path = None
        
        # Handle file upload
        if 'attachment' in request.files:
            file = request.files['attachment']
            if file and file.filename and file.filename != '':
                filename = secure_filename(file.filename)
                file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file.save(file_path)
                attachment_filename = filename
                attachment_path = file_path
        
        with get_db() as conn:
            conn.execute('''
                INSERT INTO press_releases (title, content, author_id, author_name, school_name, attachment_filename, attachment_path)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (title, content, current_user.id, current_user.full_name, current_user.school_name, attachment_filename, attachment_path))
            
            flash('Press release published successfully!', 'success')
            return redirect(url_for('press_releases'))
    
    return render_template('create_press_release.html')

@app.route('/manage_press_releases')
@login_required
@staff_required
def manage_press_releases():
    with get_db() as conn:
        if current_user.role == 'Principal':
            # Principals can see all releases from their school
            releases = conn.execute('''
                SELECT * FROM press_releases 
                WHERE school_name = ?
                ORDER BY created_at DESC
            ''', (current_user.school_name,)).fetchall()
        else:
            # ADs can only see their own releases
            releases = conn.execute('''
                SELECT * FROM press_releases 
                WHERE author_id = ?
                ORDER BY created_at DESC
            ''', (current_user.id,)).fetchall()
    
    return render_template('manage_press_releases.html', releases=releases)

@app.route('/all_schedules')
@login_required
@staff_required
def all_schedules():
    sport_filter = request.args.get('sport', '')
    school_filter = request.args.get('school', '')
    date_filter = request.args.get('date', '')
    
    with get_db() as conn:
        query = '''
            SELECT g.*, u.school_name 
            FROM games g 
            JOIN users u ON g.school_id = u.id 
            WHERE 1=1
        '''
        params = []
        
        if sport_filter:
            query += ' AND g.sport = ?'
            params.append(sport_filter)
        
        if school_filter:
            query += ' AND u.school_name = ?'
            params.append(school_filter)
        
        if date_filter:
            query += ' AND g.date = ?'
            params.append(date_filter)
        
        query += ' ORDER BY g.date ASC, g.time ASC'
        
        games = conn.execute(query, params).fetchall()
        
        # Get all schools and sports for filters
        schools = conn.execute('SELECT DISTINCT school_name FROM users WHERE role = "AD"').fetchall()
        sports = conn.execute('SELECT DISTINCT sport FROM games').fetchall()
    
    return render_template('all_schedules.html', games=games, schools=schools, sports=sports,
                         sport_filter=sport_filter, school_filter=school_filter, date_filter=date_filter)

@app.route('/api/press_releases')
def api_press_releases():
    with get_db() as conn:
        releases = conn.execute('''
            SELECT * FROM press_releases 
            WHERE published = 1 
            ORDER BY created_at DESC
        ''').fetchall()
        
        return jsonify([dict(release) for release in releases])

@app.route('/change_password', methods=['GET', 'POST'])
@login_required
@staff_required
def change_password():
    if request.method == 'POST':
        current_password = request.form['current_password']
        new_password = request.form['new_password']
        confirm_password = request.form['confirm_password']
        
        with get_db() as conn:
            user = conn.execute('SELECT password_hash FROM users WHERE id = ?', (current_user.id,)).fetchone()
            
            if not check_password_hash(user['password_hash'], current_password):
                flash('Current password is incorrect', 'danger')
            elif new_password != confirm_password:
                flash('New passwords do not match', 'danger')
            elif len(new_password) < 6:
                flash('New password must be at least 6 characters', 'danger')
            else:
                new_hash = generate_password_hash(new_password)
                conn.execute('UPDATE users SET password_hash = ? WHERE id = ?', (new_hash, current_user.id))
                flash('Password changed successfully', 'success')
                return redirect(url_for('dashboard'))
    
    return render_template('change_password.html')

if __name__ == '__main__':
    init_db()
    app.run(debug=True, host='0.0.0.0', port=5001)
from flask import Flask
from flask import render_template

app = Flask(__name__)


@app.route('/')
def hello_world():
	return 'Hello World123!'


@app.route('/user/<username>')
def show_user_profile(username):
	# показать профиль данного пользователя
	return 'User %s' % username


@app.route('/hello/')
@app.route('/hello/<name>')
def hello(name=None):
	return render_template('hello.html', name=name)


@app.route('/get-stl')
def get_stl(name=None):
	return render_template('stl_viewer.html', name=name)


if __name__ == '__main__':
	app.run(host="192.168.1.64", port=2000, debug=1)

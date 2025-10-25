from app import create_app


def main():
    app = create_app()

    print(f"Starting Prismo Backend on port {app.config['PORT']}")
    app.run(host="0.0.0.0", port=app.config["PORT"], debug=app.config["DEBUG"])


if __name__ == "__main__":
    main()

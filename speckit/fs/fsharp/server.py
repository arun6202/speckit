import http.server
import socketserver
import json
import subprocess
import os
import uuid
import sys

PORT = 8000

class FSharpRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/api/run':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data.decode('utf-8'))
                code = data.get('code', '')
                
                # Run the F# code
                result = self.run_fsharp_code(code)
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(result).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    "success": False,
                    "output": "",
                    "errors": f"Server error: {str(e)}"
                }).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

    def do_OPTIONS(self):
        # Support preflight request for CORS if needed (good practice)
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def run_fsharp_code(self, code):
        temp_dir = os.path.join(os.getcwd(), 'temp')
        if not os.path.exists(temp_dir):
            os.makedirs(temp_dir)
            
        temp_file_name = f"run_{uuid.uuid4().hex}.fsx"
        temp_file_path = os.path.join(temp_dir, temp_file_name)
        
        # Write user F# code to temp file
        with open(temp_file_path, "w", encoding="utf-8") as f:
            f.write(code)
            
        try:
            # Run F# Interactive
            res = subprocess.run(
                ["dotnet", "fsi", "--nologo", temp_file_path],
                capture_output=True,
                text=True,
                timeout=6, # 6-second execution limit
                encoding="utf-8"
            )
            
            # F# Interactive usually returns exit code 0 if script ran without unhandled exception
            success = (res.returncode == 0)
            return {
                "success": success,
                "output": res.stdout,
                "errors": res.stderr
            }
        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "output": "",
                "errors": "Timeout Error: The script exceeded the 6-second execution limit. Look out for infinite loops!"
            }
        except Exception as e:
            return {
                "success": False,
                "output": "",
                "errors": f"Execution failed: {str(e)}"
            }
        finally:
            # Clean up temp file
            if os.path.exists(temp_file_path):
                try:
                    os.remove(temp_file_path)
                except Exception as ex:
                    print(f"Warning: Failed to delete temp file {temp_file_path}: {str(ex)}")

def main():
    # Clear temp folder on startup if it exists
    temp_dir = os.path.join(os.getcwd(), 'temp')
    if os.path.exists(temp_dir):
        for file in os.listdir(temp_dir):
            try:
                os.remove(os.path.join(temp_dir, file))
            except:
                pass
                
    # Direct server to serve workspace files
    handler = FSharpRequestHandler
    socketserver.TCPServer.allow_reuse_address = True
    
    with socketserver.TCPServer(("", PORT), handler) as httpd:
        print(f"F# Interactive Guide Server started at http://localhost:{PORT}")
        print("Press Ctrl+C to stop.")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nStopping server...")
            httpd.server_close()
            sys.exit(0)

if __name__ == "__main__":
    main()

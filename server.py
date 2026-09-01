#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""极简日历 webcal 服务：仅托管本目录下的 .ics 文件，绑定 127.0.0.1。"""
import http.server
import socketserver
import os

PORT = 8123
DIR = os.path.dirname(os.path.abspath(__file__))


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIR, **kwargs)

    def guess_type(self, path):
        if path.lower().endswith(".ics"):
            return "text/calendar; charset=utf-8"
        return super().guess_type(path)

    def log_message(self, *args):
        pass  # 静默日志


if __name__ == "__main__":
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("127.0.0.1", PORT), Handler) as httpd:
        httpd.serve_forever()

"""Independent standard-library probes. No database credentials, SQL or SMS."""
import argparse
from concurrent.futures import ThreadPoolExecutor
import socket
import struct
import urllib.error
import urllib.request


def postgres_probe(address, port):
    connected = False
    try:
        with socket.create_connection((address, port), timeout=4) as client:
            connected = True
            client.settimeout(4)
            client.sendall(struct.pack('!II', 8, 80877103))
            reply = client.recv(1)
        return {b'S': 'POSTGRES_SSL_REPLY_OK', b'N': 'POSTGRES_SSL_REJECTED', b'': 'REMOTE_CLOSED'}.get(reply, 'UNEXPECTED_PROTOCOL_REPLY')
    except TimeoutError:
        return 'TCP_CONNECTED_POSTGRES_SSL_TIMEOUT' if connected else 'TCP_CONNECTION_TIMEOUT'
    except OSError as error:
        return f'NETWORK_ERROR_{error.errno or "UNKNOWN"}'


def https_probe(host):
    # An HTTP error still proves DNS/TCP/TLS/HTTP reachability; it does not
    # establish database health or authorization. No API key is sent.
    try:
        request = urllib.request.Request(f'https://{host}/auth/v1/health', method='GET')
        with urllib.request.urlopen(request, timeout=6) as response:
            return f'HTTPS_REACHABLE_HTTP_{response.status}'
    except urllib.error.HTTPError as error:
        return f'HTTPS_REACHABLE_HTTP_{error.code}'
    except Exception:
        return 'HTTPS_UNREACHABLE_OR_TLS_FAILED'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--pooler-host', required=True)
    parser.add_argument('--api-host', required=True)
    args = parser.parse_args()
    print('Independent Python checks: no credentials, SQL, account writes or SMS.')
    try:
        addresses = sorted({item[4][0] for item in socket.getaddrinfo(args.pooler_host, 5432, socket.AF_INET, socket.SOCK_STREAM)})[:4]
    except OSError:
        print('Pooler DNS: FAILED')
        return 1
    print(f'Pooler DNS: resolved {len(addresses)} IPv4 address(es); testing each separately.')
    with ThreadPoolExecutor(max_workers=9) as executor:
        https = executor.submit(https_probe, args.api_host)
        checks = [(number, port, executor.submit(postgres_probe, address, port))
                  for number, address in enumerate(addresses, 1) for port in (5432, 6543)]
        print(f'Supabase HTTPS: {https.result()}')
        results = []
        for number, port, future in checks:
            result = future.result()
            results.append(result)
            print(f'Python address #{number}, port {port}: {result}')
    if all(result == 'POSTGRES_SSL_REPLY_OK' for result in results):
        print('Finding: PostgreSQL SSL negotiation is reachable independently of Node.')
    elif 'POSTGRES_SSL_REPLY_OK' in results:
        print('Finding: availability differs by address or port; a blanket hotspot diagnosis is not established.')
    else:
        print('Finding: the PostgreSQL handshake also fails outside Node/Next.js. Carrier, local security and remote pooler causes remain possible.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())

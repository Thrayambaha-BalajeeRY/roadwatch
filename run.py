import sys
import multiprocessing
sys.path.insert(0, r'C:\Users\H\OneDrive\Desktop\roadwatch')

if __name__ == '__main__':
    multiprocessing.freeze_support()
    import uvicorn
    uvicorn.run('ai.detect:app', host='0.0.0.0', port=8000, reload=True)

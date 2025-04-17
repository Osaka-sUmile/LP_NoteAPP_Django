document.addEventListener('DOMContentLoaded', () => {
    // Intersection Observerの設定
    const options = {
        root: null,
        rootMargin: '0px',
        threshold: 0.3
    };

    // アニメーション要素の監視を開始
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // 要素が表示されたら、アニメーションクラスを追加
                entry.target.classList.add('animate');
                
                // 強調テキストのアニメーションも開始
                const strong = entry.target.querySelector('strong');
                if (strong) {
                    setTimeout(() => {
                        strong.classList.add('animate');
                    }, 300); // マーカーアニメーションを少し遅らせる
                }
                
                // 一度表示されたら監視を解除
                observer.unobserve(entry.target);
            }
        });
    }, options);

    // 監視する要素を登録
    const elements = document.querySelectorAll(
        '.introduction__bullet-1--flex, ' +
        '.introduction__bullet-2--flex, ' +
        '.introduction__bullet-3--flex, ' +
        '.introduction__bullet-4--flex'
    );
    
    elements.forEach((element, index) => {
        observer.observe(element);
    });
}); 

// Animation section
document.addEventListener('DOMContentLoaded', () => {
    const stream = document.querySelector('.note-stream');
    const streamWidth = 800;
    const noteSpacing = 100;
    const rightUserPosition = 600;
    const leftUserPosition = 200;
    const streamTopPosition = 0;
    const moveDuration = 400;
    const pauseDuration = 2000;
    const cycleTime = moveDuration + pauseDuration;
    let isMoving = false;
    let emptyPosition = null;
    let noteCounter = 0;
    let dropTurnCount = 0;
    let lastDroppedNote = null;

    // ストリームの初期化時にすべての要素を削除
    while (stream.firstChild) {
        stream.removeChild(stream.firstChild);
    }

    function createStreamingNotes() {
        const numberOfNotes = Math.floor(streamWidth / noteSpacing) + 3;
        for (let i = 0; i < numberOfNotes; i++) {
            const note = createNote(i * noteSpacing);
            stream.appendChild(note);
        }
        startAnimation();
    }

    function createNote(leftPosition) {
        const note = document.createElement('div');
        note.className = 'note';
        note.style.left = `${leftPosition}px`;
        // データ属性を追加して追跡を容易に
        note.dataset.moving = 'true';
        return note;
    }

    function startAnimation() {
        setInterval(() => {
            if (isMoving) return;
            isMoving = true;

            const notes = stream.querySelectorAll('.note[data-moving="true"]');
            notes.forEach(note => {
                const currentLeft = parseFloat(note.style.left);
                const newLeft = currentLeft - noteSpacing;
                
                note.style.transition = `left ${moveDuration}ms ease-in-out`;

                if (newLeft < -noteSpacing) {
                    note.remove();
                } else {
                    note.style.left = `${newLeft}px`;
                }
            });

            if (emptyPosition !== null) {
                emptyPosition -= noteSpacing;
                
                // 空いている位置が左のユーザーの上に来たら新しいノートを追加
                if (Math.abs(emptyPosition - leftUserPosition) < noteSpacing/2) {
                    riseNewNote();
                    emptyPosition = null;
                }
                
                if (emptyPosition < -noteSpacing) {
                    emptyPosition = null;
                }
            }

            setTimeout(() => {
                const currentNotes = stream.querySelectorAll('.note[data-moving="true"]');
                currentNotes.forEach(note => {
                    note.style.transition = 'none';
                });
                isMoving = false;
                checkForDrop();
            }, moveDuration);

        }, cycleTime);

        // 右端のノート補充
        setInterval(() => {
            if (isMoving) return;
            const rightmostNote = Array.from(stream.querySelectorAll('.note'))
                .reduce((max, note) => {
                    const left = parseFloat(note.style.left);
                    return left > max ? left : max;
                }, -noteSpacing);

            if (rightmostNote < streamWidth) {
                const newNote = createNote(streamWidth);
                stream.appendChild(newNote);
            }
        }, cycleTime / 2);
    }

    function riseNewNote() {
        const note = createNote(leftUserPosition);
        note.classList.add('rising');
        note.dataset.moving = 'false';
        
        // 最初から合流位置の高さ+100pxの位置に配置
        note.style.left = `${leftUserPosition}px`;
        note.style.top = `${streamTopPosition +150}px`;
        note.style.opacity = '0';
        stream.appendChild(note);

        // まずはその場でフェードインのみ
        const fadeInDuration = 1800;
        note.style.transition = `opacity ${fadeInDuration}ms ease-out`;
        note.style.opacity = '1';

        // 合流のタイミングで上昇
        setTimeout(() => {
            const riseDuration = 600;
            note.style.transition = `top ${riseDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
            note.style.top = `${streamTopPosition}px`;

            setTimeout(() => {
                note.style.transition = 'none';
                note.classList.remove('rising');
                note.dataset.moving = 'true';
            }, riseDuration);
        }, 240);
    }

    function dropNote(note) {
        note.classList.add('dropping');
        note.dataset.moving = 'false';
        
        const pauseDuration = 500;
        const dropDuration = 600;
        const fadeOutDuration = 2400;

        setTimeout(() => {
            note.style.transition = `transform ${dropDuration}ms cubic-bezier(.17,.67,.83,.67)`;
            note.style.transform = 'translateY(150px)';
            
            // 落下後すぐにフェードアウト開始
            setTimeout(() => {
                note.style.transition = `all ${fadeOutDuration}ms ease-out`;
                note.style.opacity = '0';
                note.style.transform += ' translateY(20px)';
                
                setTimeout(() => {
                    note.remove();
                }, fadeOutDuration);
            }, dropDuration);
        }, pauseDuration);
    }

    function checkForDrop() {
        if (isMoving) return;

        const notes = stream.querySelectorAll('.note[data-moving="true"]');
        notes.forEach(note => {
            const currentLeft = parseFloat(note.style.left);
            if (Math.abs(currentLeft - rightUserPosition) < noteSpacing/2) {
                noteCounter++;
                
                // 4ノートごとに離脱
                if (noteCounter % 4 === 1) {
                    emptyPosition = currentLeft;
                    dropNote(note);
                }
            }
        });
    }

    // 初期化
    createStreamingNotes();
});
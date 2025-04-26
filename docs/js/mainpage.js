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
    if (!stream) {
        console.error("Element with class '.note-stream' not found.");
        return;
    }
    const usersContainer = document.querySelector('.users'); // Get reference to users container
    // --- Debug Log --- Check if usersContainer was found
    if (usersContainer) {
        console.log("Debug: .users container found:", usersContainer);
    } else {
        console.error("Debug: .users container NOT found!");
    }
    // --- End Debug Log ---

    let noteWidth, noteHeight, noteSpacing;
    let streamWidth, leftUserPosition, rightUserPosition;
    const streamTopPosition = 0;

    // --- Animation Control ---
    const moveDuration = 600; // Duration for the note movement transition (slightly slower)
    const pauseDuration = 1800; // Pause between movements
    const cycleTime = moveDuration + pauseDuration;
    let animationIntervalId = null; // ID for the main animation interval
    let noteAdditionIntervalId = null; // ID for the note addition interval
    let isMoving = false; // Flag to prevent overlap

    // --- State Tracking ---
    let emptyPosition = null;
    let noteCounter = 0;

    const totalNoteImages = 7; // Total number of note images (1 to 7)

    function updateLayoutParameters() {
        streamWidth = stream.clientWidth;
        if (streamWidth <= 0) return;

        const visibleNotesEstimate = 6;
        noteSpacing = streamWidth / visibleNotesEstimate;
        noteWidth = noteSpacing * 0.6;
        noteHeight = noteWidth * 1.4;

        noteWidth = Math.max(30, noteWidth);
        noteHeight = Math.max(42, noteHeight);
        noteSpacing = Math.max(50, noteSpacing);

        // ノートの配置とユーザーアイコンの位置を計算
        const centerPosition = streamWidth / 2;
        leftUserPosition = centerPosition - noteSpacing * 2;  // 左から3番目のノートの位置
        rightUserPosition = centerPosition + noteSpacing * 1;  // 右から3番目のノートの位置

        // Set CSS custom properties for user icon positions
        if (usersContainer) {
            usersContainer.style.setProperty('--left-user-pos', `${leftUserPosition}px`);
            usersContainer.style.setProperty('--right-user-pos', `${rightUserPosition}px`);
        }
    }

    function createNote(leftPosition) {
        // console.log(`Creating note at left: ${leftPosition}`);
        const note = document.createElement('div');
        note.className = 'note';
        note.style.left = `${leftPosition}px`;
        note.style.width = `${noteWidth}px`;
        note.style.height = `${noteHeight}px`;
        note.style.top = `${streamTopPosition}px`;
        note.dataset.moving = 'true';

        // Determine image number randomly (1 to totalNoteImages)
        const imageNum = Math.floor(Math.random() * totalNoteImages) + 1;
        // console.log(` -> Random image number: ${imageNum}`);

        // Create and append the image element
        const img = document.createElement('img');
        img.src = `images/mainpage/note_${imageNum}.png`;
        img.alt = `ノート${imageNum}`;
        try {
            note.appendChild(img);
        } catch (error) {
            console.error(`Error appending img to note div in createNote:`, error);
        }

        return note;
    }

    function clearAnimationAndNotes() {
        // Clear intervals
        if (animationIntervalId) clearInterval(animationIntervalId);
        if (noteAdditionIntervalId) clearInterval(noteAdditionIntervalId);
        animationIntervalId = null;
        noteAdditionIntervalId = null;

        // Remove all notes
        while (stream.firstChild) {
            stream.removeChild(stream.firstChild);
        }
        // Reset state
        isMoving = false;
        emptyPosition = null;
        noteCounter = 0;
    }

    function createInitialNotes() {
        const numberOfNotes = Math.floor(streamWidth / noteSpacing) + 4;
        for (let i = 0; i < numberOfNotes; i++) {
            // Call createNote without index
            const note = createNote(i * noteSpacing);
            stream.appendChild(note);
        }
    }

    function startAnimation() {
        // Ensure previous intervals are cleared
        if (animationIntervalId) clearInterval(animationIntervalId);
        if (noteAdditionIntervalId) clearInterval(noteAdditionIntervalId);

        animationIntervalId = setInterval(() => {
            if (isMoving) return;
            isMoving = true;

            const notes = stream.querySelectorAll('.note[data-moving="true"]');
            notes.forEach(note => {
                let currentLeft = parseFloat(note.style.left);
                let newLeft = currentLeft - noteSpacing; // Move by one full spacing

                note.style.transition = `left ${moveDuration}ms ease-in-out`;
                note.style.left = `${newLeft}px`;

                // Remove notes fully off-screen after transition likely completes
                // Use a timeout slightly longer than moveDuration
                setTimeout(() => {
                     if (newLeft < -noteWidth * 1.5) {
                         // Check if the note still exists before removing
                        if (note.parentNode === stream) {
                            note.remove();
                        }
                    }
                 }, moveDuration + 100); // Add buffer
            });

            // Handle the empty position shift
            if (emptyPosition !== null) {
                emptyPosition -= noteSpacing;
                // Check if the gap reached the rise position
                if (Math.abs(emptyPosition - leftUserPosition) < noteSpacing / 2) {
                    riseNewNote();
                    emptyPosition = null;
                }
                // Reset if gap moves off screen
                if (emptyPosition < -noteSpacing * 2) {
                    emptyPosition = null;
                }
            }

            // After move duration, allow next move and check for drops
            setTimeout(() => {
                // It's crucial to re-query notes that might have been added/removed
                const currentNotes = stream.querySelectorAll('.note[data-moving="true"]');
                currentNotes.forEach(note => {
                    // Remove transition for instant position update next cycle if needed
                    note.style.transition = 'none';
                    // Check for drop position after movement completes
                    checkForDrop(note);
                });
                isMoving = false;
            }, moveDuration);

        }, cycleTime);

        // Interval for adding new notes from the right
        noteAdditionIntervalId = setInterval(() => {
             if (isMoving) return; // Don't add if animation is in progress

            const rightmostNoteLeft = Array.from(stream.querySelectorAll('.note'))
                .reduce((max, note) => Math.max(max, parseFloat(note.style.left)), -Infinity);

             // Add a new note if there's space on the right
            if (rightmostNoteLeft < streamWidth + noteSpacing) {
                const newNoteLeft = Math.max(streamWidth, rightmostNoteLeft + noteSpacing);
                if (!stream.querySelector(`.note[style*="left: ${newNoteLeft}px"]`)){
                     // Call createNote without index
                    const newNote = createNote(newNoteLeft);
                    stream.appendChild(newNote);
                }
            }
        }, cycleTime / 1.5); // Add notes slightly more often than the main cycle
    }

    function riseNewNote() {
        if (stream.querySelector('.note.rising')) return;

        // Call createNote without index - it handles random selection
        const note = createNote(leftUserPosition);

        note.classList.add('rising');
        note.dataset.moving = 'false';
        note.style.top = `${streamTopPosition + noteHeight * 0.8}px`;
        note.style.opacity = '0';
        stream.appendChild(note);

        const riseDuration = 800;
        const fadeInDelay = 400;

        setTimeout(() => {
            note.style.transition = `top ${riseDuration}ms cubic-bezier(0.4, 0, 0.2, 1), opacity ${riseDuration * 0.8}ms ease-out`;
            note.style.top = `${streamTopPosition}px`;
            note.style.opacity = '1';

            setTimeout(() => {
                note.style.transition = 'none';
                note.classList.remove('rising');
                note.dataset.moving = 'true';
            }, riseDuration);
        }, fadeInDelay);
    }

    function dropNote(note) {
        note.classList.add('dropping');
        note.dataset.moving = 'false';

        const pauseBeforeDrop = 200;
        const dropDuration = 800; // Make drop even slower (was 1000)
        const fadeOutDuration = 1000; // Make fade out even slower (was 2000)

        setTimeout(() => {
            note.style.transition = `transform ${dropDuration}ms cubic-bezier(.42,0,.58,1)`;
            // Reduce the distance the note drops
            note.style.transform = `translateY(${noteHeight * 1.1}px)`; // Reduced drop distance (was 1.5)

            setTimeout(() => {
                note.style.transition = `opacity ${fadeOutDuration}ms ease-out`;
                note.style.opacity = '0';
                setTimeout(() => {
                    // Ensure note still exists before removing
                    if(note.parentNode === stream) {
                        note.remove();
                    }
                }, fadeOutDuration);
            }, dropDuration / 2);
        }, pauseBeforeDrop);
    }

    // Check for drop condition for a specific note (called after movement)
    function checkForDrop(note) {
         // Ensure the note is still supposed to be moving and hasn't been dropped/risen
         if (note.dataset.moving !== 'true') return;

         let currentLeft = parseFloat(note.style.left);

         // Check if the note is at the drop position
         if (Math.abs(currentLeft - rightUserPosition) < noteSpacing / 2) {
             noteCounter++;
             if (noteCounter % 4 === 1) {
                 emptyPosition = currentLeft;
                 dropNote(note);
             }
        }
    }

    function initializeAnimation() {
        clearAnimationAndNotes();
        updateLayoutParameters();
        if (streamWidth > 0) {
            createInitialNotes();
            startAnimation();
        }
    }

    initializeAnimation();

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            initializeAnimation();
        }, 250);
    });
});
-- Add lecture_id column to notes table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'notes'
        AND column_name = 'lecture_id'
    ) THEN
        ALTER TABLE public.notes 
        ADD COLUMN lecture_id UUID REFERENCES public.lectures(id) ON DELETE CASCADE;
        
        -- Add index for better performance
        CREATE INDEX IF NOT EXISTS idx_notes_lecture_id ON public.notes(lecture_id);
        
        RAISE NOTICE 'Added lecture_id column to notes table';
    ELSE
        RAISE NOTICE 'lecture_id column already exists in notes table';
    END IF;
END
$$; 
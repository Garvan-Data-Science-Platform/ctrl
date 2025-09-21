import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import { useEffect, useMemo, useState } from 'react'
import duoJson from './duo.json'

export interface DUOEntry {
  ID: string
  Label: string
  Description: string
  Comment: string
}

interface DUOModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (duo: DUOEntry, relatedAnswer: string | boolean) => void
  questionText: string
  answers: (string | boolean)[]
}

const duoEntries = duoJson as DUOEntry[]

export function DUOModal({ open, onClose, onConfirm, answers, questionText }: DUOModalProps) {
  const [search, setSearch] = useState('')
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<string | boolean>('')

  // Filtered results
  const filtered = useMemo(() => {
    if (!search) return duoEntries
    const s = search.toLowerCase()
    return duoEntries.filter(
      (entry) =>
        entry.ID.toLowerCase().includes(s) ||
        entry.Label.toLowerCase().includes(s) ||
        entry.Description.toLowerCase().includes(s) ||
        entry.Comment.toLowerCase().includes(s),
    )
  }, [search, duoEntries])

  // Reset selection when modal opens/closes
  useEffect(() => {
    if (!open) {
      setSearch('')
      setSelectedIdx(null)
      setSelectedAnswer('')
    }
  }, [open])

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Select DUO Code</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            placeholder="Filter DUO Codes"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            autoFocus
            data-cy="duo-filter"
          />
        </Box>
        <Box sx={{ height: 300, overflow: 'auto', mb: 2 }}>
          <List dense data-cy="duo-results">
            {filtered.map((entry, idx) => (
              <ListItem
                key={entry.ID}
                disablePadding
                sx={{ bgcolor: selectedIdx === idx ? 'rgba(25,118,210,0.08)' : undefined }}
              >
                <ListItemButton selected={selectedIdx === idx} onClick={() => setSelectedIdx(idx)}>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <Typography variant="subtitle2" sx={{ minWidth: 120 }}>
                          {entry.ID}
                        </Typography>
                        <Typography variant="body1" fontWeight="bold" textTransform="capitalize">
                          {entry.Label}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Typography variant="body2" color="text.secondary">
                        {entry.Description}
                        {entry.Comment && (
                          <Box
                            component="span"
                            sx={{ display: 'block', mt: 0.5, color: 'text.disabled' }}
                          >
                            {entry.Comment}
                          </Box>
                        )}
                      </Typography>
                    }
                  />
                </ListItemButton>
              </ListItem>
            ))}
            {filtered.length === 0 && (
              <ListItem>
                <Typography color="text.secondary">No results found.</Typography>
              </ListItem>
            )}
          </List>
        </Box>
        <Box>
          <Typography fontWeight="bold">Question Text: </Typography>
          <Typography fontStyle="italic">{questionText}</Typography>
        </Box>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 1, mt: 1 }}>
            Which answer does this DUO code apply to?
          </Typography>
          <Select
            fullWidth
            value={selectedAnswer}
            onChange={(e) => setSelectedAnswer(e.target.value)}
            displayEmpty
            data-cy="duo-answer"
          >
            <MenuItem value="" disabled>
              Select answer
            </MenuItem>
            {answers.map((ans) => (
              <MenuItem key={`item_${ans}`} value={ans as any}>
                {String(ans)}
              </MenuItem>
            ))}
          </Select>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={selectedIdx === null || selectedAnswer === ''}
            onClick={() => {
              if (selectedIdx !== null && selectedAnswer !== '') {
                onConfirm(filtered[selectedIdx], selectedAnswer)
              }
            }}
            data-cy="confirm-duo"
          >
            Add DUO Code
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  )
}

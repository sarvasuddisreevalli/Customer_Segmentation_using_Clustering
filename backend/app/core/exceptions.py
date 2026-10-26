"""
exceptions.py
-------------
Application domain exceptions and centralized error models.
"""

from typing import Any, Dict, Optional


class SegmentIQException(Exception):
    """Base domain exception for SegmentIQ application."""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message)
        self.message = message
        self.details = details or {}


class DatasetNotFoundError(SegmentIQException):
    """Raised when a requested dataset ID does not exist."""
    pass


class DatasetValidationError(SegmentIQException):
    """Raised when an uploaded dataset fails validation checks."""
    pass


class ClusteringRunNotFoundError(SegmentIQException):
    """Raised when a clustering run ID is not found."""
    pass


class ClusteringExecutionError(SegmentIQException):
    """Raised when an ML clustering algorithm fails during execution."""
    pass


class FileSecurityError(SegmentIQException):
    """Raised when an unsafe file path or potential directory traversal is detected."""
    pass

<?php

namespace Oak\Proxy\Tests;

/**
 * Redirects `error_log` output to a temp file for the duration of a test,
 * so logged failures stay quiet and can be asserted on.
 */
trait ErrorLogCapture
{
    /**
     * Points `error_log` at a temp file; returns [temp file, previous setting].
     *
     * @return array
     */
    protected function captureErrorLog(): array
    {
        $logFile = tempnam(sys_get_temp_dir(), 'photo_submit_log_');

        return [$logFile, ini_set('error_log', $logFile)];
    }

    /**
     * Restores `error_log` and returns what was logged meanwhile.
     *
     * @param array $log The value returned by captureErrorLog().
     * @return string
     */
    protected function restoreErrorLog(array $log): string
    {
        [$logFile, $previous] = $log;
        ini_set('error_log', $previous === FALSE ? '' : $previous);
        $logged = (string) file_get_contents($logFile);
        unlink($logFile);

        return $logged;
    }
}

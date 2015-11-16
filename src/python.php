<?php # -*- coding: utf-8 -*-
/* Plugin Name: Python embedded */

add_shortcode( 'python', 'embed_python' );

function embed_python( $attributes )
{
	if(!isset($_POST['mysubmit'])) // assuming you're using POST and submit button name is 'submit'
        return;
    $data = shortcode_atts(
        array(
            'file' => 'uberRide.py'
        ),
        $attributes
    );
	$descriptorspec = array(
		0 => array("pipe", "r"),  // stdin is a pipe that the child will read from
		1 => array("pipe", "w"),  // stdout is a pipe that the child will write to
		2 => array("pipe", "w") // stderr is a file to write to
	);
	/*$handle = popen( __DIR__ . '/' . $data['file'], 'r');*/
	$user = $_POST["myemail"];
	$pwd = $_POST["mypassword"];
	if ($pwd) {
		$process  = proc_open ( __DIR__ . '/' . $data['file'].' '.$user.' '.$pwd, $descriptorspec, $pipes);
		if (is_resource($process)) {
			//wp_enqueue_script( 'readUber', get_template_directory_uri() . '../../../plugins/python/js/readUber.js' );
			$uberData = stream_get_contents($pipes[1]);
			fclose($pipes[1]);
			//if(trim($uberData) != "Invalid")
			echo "<input type=\"hidden\" id=\"UberData\" name=\"UberData\" value=".rawurlencode($uberData).">";
			//else echo "Invalid Email or Password, try again.";
			while($pdf_content = fgets($pipes[2]))
			{
				echo "Error:" . $pdf_content . "<br>";
			}
			fclose($pipes[2]);

			// It is important that you close any pipes before calling
			// proc_close in order to avoid a deadlock
			$return_value = proc_close($process);
		}
	}
}

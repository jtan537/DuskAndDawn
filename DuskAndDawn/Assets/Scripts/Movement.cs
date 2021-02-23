// using System.Collections;
// using System.Collections.Generic;
// using UnityEngine;

// public class Movement : MonoBehaviour
// {
//     public CharacterController controller;

//     public float speed = 6f;

//     // Update is called once per frame
//     void Update()
//     {
//         float horizontal = Input.GetAxisRaw("Horizontal");
// 	    float vertical = Input.GetAxisRaw("Vertical");
// 		Vector3 direction = new Vector3(horizontal, 0f, vertical).normalized;

// 		if (direction.magnitude >= 0.1f)
// 		{
// 			controller.Move(direction * speed * Time.deltaTime);
// 		}
//     }
// }

using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class Movement : MonoBehaviour
{
    public CharacterController controller;
    private Vector3 playerVelocity;
    private bool groundedPlayer;
    private float playerSpeed = 10.0f;
    private float jumpHeight = 8f;
    private float gravityValue = -9.81f;

    void Update()
    {
        groundedPlayer = controller.isGrounded;
        if (groundedPlayer && playerVelocity.y < 0)
        {
            playerVelocity.y = 0f;
        }

        Vector3 move = new Vector3(Input.GetAxis("Horizontal"), 0, Input.GetAxis("Vertical"));
        controller.Move(move * Time.deltaTime * playerSpeed);

        if (move != Vector3.zero)
        {
            gameObject.transform.forward = move;
        }

        // Changes the height position of the player..
        if (Input.GetButtonDown("Jump") && groundedPlayer)
        {
            playerVelocity.y += Mathf.Sqrt(jumpHeight * -3.0f * gravityValue);
        }

        playerVelocity.y += gravityValue * Time.deltaTime;
        controller.Move(playerVelocity * Time.deltaTime);
    }
}
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class ThirdPersonMovement : MonoBehaviour
{
    public CharacterController controller;
    public Transform cam;

    private float speed = 25f;

    private float turnSmoothTime = 0.2f;
    float turnSmoothVelocity;

    private Vector3 playerVelocity;
    private bool groundedPlayer;
    public Transform groundCheck;
    public float groundDistance = 0.4f;
    public LayerMask groundMask;
    private float jumpHeight = 1.3f;
    private float gravityValue = -9.81f;
    Vector3 movedir;


    // Update is called once per frame
    void Update()
    {
        groundedPlayer = Physics.CheckSphere(groundCheck.position, groundDistance, groundMask);
        if (groundedPlayer && playerVelocity.y < 0)
        {
            playerVelocity = Vector3.zero;
        }

        Vector3 move = new Vector3(Input.GetAxisRaw("Horizontal"), 0, Input.GetAxisRaw("Vertical"));
        
        if (move.magnitude >= 0.1f)
        {
            float targetAngle = Mathf.Atan2(move.x, move.z) * Mathf.Rad2Deg + cam.eulerAngles.y;
            float angle = Mathf.SmoothDampAngle(transform.eulerAngles.y, targetAngle, ref turnSmoothVelocity, turnSmoothTime);
            transform.rotation = Quaternion.Euler(0f, targetAngle, 0f);

            movedir = Quaternion.Euler(0f, targetAngle, 0f) * Vector3.forward;
            controller.Move(movedir.normalized * Time.deltaTime * speed);

            if (movedir.normalized != Vector3.zero)
            {
                gameObject.transform.forward = movedir.normalized;
            }
        }
        else
        {
            movedir = Vector3.zero;
        }

        // Changes the height position of the player..
        if (Input.GetButtonDown("Jump") && groundedPlayer)
        {
            playerVelocity.y += Mathf.Sqrt(jumpHeight * -3.0f * gravityValue);
        }

        playerVelocity.y += gravityValue * Time.deltaTime;
        controller.Move(playerVelocity * Time.deltaTime * 10f);
    }
}
